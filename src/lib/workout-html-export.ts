import type { WorkoutRow } from "@/components/workout/WorkoutDisplay";
import type { ExportExercise } from "./exercise-card-export";
import { exerciseFacts, exerciseFilename } from "./exercise-card-export";
import { supabase } from "@/integrations/supabase/client";
import { getExerciseMediaUrl } from "./exercise-media";
import { buildSlides, extractSoftTissue, parseStepTiming, parseWorkoutSteps } from "./workout/parse-steps";
import { EXERCISE_TOKEN_RE, uniqueTokenIds } from "./workout/tokens";
import { difficultyLabel } from "./workout/spec";
import { embeddedHtml, escapeHtml, htmlDocument, safeJson, type HtmlExportFile } from "./standalone-html";

export function exportedPlayerSlides(html: string) {
  return buildSlides(parseWorkoutSteps(html), extractSoftTissue(html)).map(slide => ({ ...slide, timing: slide.kind === "exercise" ? parseStepTiming(slide.step) : { mode: "manual" as const } }));
}

// Standalone player deliberately has no account, network, workout-result or logging integration.
const PLAYER_SCRIPT = `
const slides=DATA.slides,exercises=DATA.exercises;
const player=document.getElementById('player'),detail=document.getElementById('exercise-detail'),body=document.getElementById('player-body');
let index=0,running=false,remaining=0,round=1,phase='work',timer=null,sound=false,audio=null,lastTick=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function beep(){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=880;g.gain.value=.12;o.start();o.stop(audio.currentTime+.15)}catch{}}
function stop(){running=false;clearInterval(timer);timer=null}
function reset(){stop();round=1;phase='work';const t=slides[index]?.timing;remaining=t?.mode==='timed'?t.seconds:t?.mode==='tabata'?t.work:0;render()}
function render(){const s=slides[index];document.getElementById('player-progress').textContent=s?(index+1)+' / '+slides.length:'';document.getElementById('previous').disabled=index===0;document.getElementById('next').textContent=index>=slides.length-1?'Finish workout':'Next →';if(!s){body.innerHTML='<h2>Workout complete!</h2>';document.getElementById('next').hidden=true;return}document.getElementById('next').hidden=false;
let content='';if(s.kind==='exercise'){const ex=exercises[s.step.exerciseId];content='<p class="accent">'+esc(s.step.section)+(s.step.subSection?' · '+esc(s.step.subSection):'')+'</p>'+(ex?.media?'<img class="demo" src="'+ex.media+'" alt="'+esc(s.step.name)+' demonstration">':'')+'<h2>'+esc(s.step.name)+'</h2><p>'+esc(s.step.prescription)+'</p>'+(ex?'<button data-exercise="'+esc(ex.id)+'">Exercise details</button>':'');const t=s.timing;if(t.mode!=='manual'){content+='<div class="clock">'+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0')+'</div>'+(t.mode==='tabata'?'<p>'+esc(phase==='work'?'Work':'Rest')+' · Interval '+round+' / '+t.rounds+'</p>':'')+'<div class="player-controls"><button id="toggle-timer">'+(running?'Pause':'Start timer')+'</button><button id="reset-timer">↺ Reset</button></div>'}}
else if(s.kind==='soft-tissue')content='<h2>Soft Tissue Preparation</h2>'+s.lines.map(l=>'<p>'+esc(l)+'</p>').join('');else content='<h2>'+esc(s.next)+'</h2><p class="muted">'+esc(s.previous)+' complete</p>';body.innerHTML=content;document.getElementById('toggle-timer')?.addEventListener('click',toggleTimer);document.getElementById('reset-timer')?.addEventListener('click',reset)}
function toggleTimer(){if(running){stop();render();return}if(remaining<=0)reset();running=true;lastTick=performance.now();beep();render();timer=setInterval(()=>{const now=performance.now(),elapsed=Math.floor((now-lastTick)/1000);if(elapsed<1)return;lastTick+=elapsed*1000;remaining=Math.max(0,remaining-elapsed);if(remaining===0){beep();const t=slides[index]?.timing;if(t?.mode==='tabata'){if(phase==='work'){phase='rest';remaining=t.rest}else if(round<t.rounds){round++;phase='work';remaining=t.work}else stop()}else stop()}render()},200)}
document.getElementById('start-player')?.addEventListener('click',()=>{index=0;reset();player.showModal()});document.getElementById('previous').addEventListener('click',()=>{if(index>0){index--;reset()}});document.getElementById('next').addEventListener('click',()=>{index++;reset()});document.getElementById('sound').addEventListener('click',e=>{sound=!sound;e.currentTarget.textContent=sound?'Sound on':'Sound off';beep()});player.addEventListener('close',stop);
document.addEventListener('click',e=>{const target=e.target.closest('[data-exercise]');if(target){const ex=exercises[target.dataset.exercise];if(ex){document.getElementById('exercise-body').innerHTML=ex.card;detail.showModal()}}const close=e.target.closest('[data-close]');if(close)document.getElementById(close.dataset.close).close()});
document.getElementById('reader').addEventListener('click',()=>document.getElementById('workout-content').scrollIntoView({behavior:'smooth'}));
`;

export async function workoutHtmlFile(workout: WorkoutRow, embed: (src: string) => Promise<string>): Promise<HtmlExportFile> {
  const html = workout.main_workout ?? "";
  const ids = uniqueTokenIds([html, workout.description_html, workout.instructions_html, workout.tips_html].join(" "));
  const exercises: Record<string, ExportExercise & { media: string | null; card: string }> = {};
  if (ids.length) {
    const { data, error } = await supabase.from("exercises").select("id,name,body_part,equipment,target_muscle,secondary_muscles,difficulty,description,instructions,gif_path").in("id", ids);
    if (error) throw new Error("Exercise details could not be loaded.");
    if ((data?.length ?? 0) !== ids.length) throw new Error(`An exercise in “${workout.name}” is missing from the library. Nothing was substituted.`);
    for (const ex of data ?? []) {
      let media: string | null = null;
      if (ex.gif_path) {
        const url = await getExerciseMediaUrl(ex.gif_path);
        if (!url) throw new Error(`The demonstration for ${ex.name} could not be prepared.`);
        media = await embed(url);
      }
      const card = `${media ? `<img class="demo" src="${media}" alt="${escapeHtml(ex.name)} demonstration">` : '<p class="muted">No animated demonstration is available in this library record.</p>'}<h2>${escapeHtml(ex.name)}</h2><dl class="exercise-facts">${exerciseFacts(ex).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${ex.description ? `<p>${escapeHtml(ex.description)}</p>` : ""}${ex.instructions?.length ? `<h3>How to perform</h3><ol>${ex.instructions.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>` : ""}`;
      exercises[ex.id] = { ...ex, media, card };
    }
  }
  const content = async (raw: string | null) => (await embeddedHtml(raw, embed)).replace(new RegExp(EXERCISE_TOKEN_RE.source, "g"), (_m, id: string, name: string) => `<strong>${escapeHtml(name)}</strong><button class="exercise-eye" data-exercise="${escapeHtml(id)}" aria-label="View ${escapeHtml(name)}">◉</button>`);
  const [description, main, instructions, tips, cover] = await Promise.all([content(workout.description_html), content(html), content(workout.instructions_html), content(workout.tips_html), workout.image_url ? embed(workout.image_url) : null]);
  const slides = exportedPlayerSlides(html);
  const creator = String(workout.created_by ?? "").startsWith("smarty:") ? "HARIS FALAS" : "user_name" in workout && typeof workout.user_name === "string" ? workout.user_name : "User";
  const body = `<header><div class="eyebrow">${escapeHtml([workout.category, workout.format, workout.serial ? `#${workout.serial}` : null].filter(Boolean).join(" · "))}</div><h1>${escapeHtml(workout.name)}</h1>${workout.focus ? `<p class="muted">${escapeHtml(workout.focus)}</p>` : ""}<div class="facts"><span class="accent">${"★".repeat(Math.max(0, Math.min(3, workout.difficulty_stars)))}</span><span>${escapeHtml(workout.difficulty_label ?? difficultyLabel(workout.difficulty_stars))}</span><span>${escapeHtml(workout.duration_label ?? `${workout.duration_min} min`)}</span><span>${escapeHtml(workout.location ?? "")}</span><span>${escapeHtml(workout.equipment?.join(", ") || "bodyweight")}</span></div><p>Created by <strong>${escapeHtml(creator)}</strong></p>${cover ? `<img class="cover" src="${cover}" alt="${escapeHtml(workout.name)} cover">` : ""}<div class="workout-html">${description}</div>${slides.length ? '<button class="primary start" id="start-player">Start Your Workout</button>' : ""}</header><div class="reader-bar"><button id="reader">Reader</button></div><article class="panel workout-html" id="workout-content">${main}</article>${instructions ? `<section class="panel workout-html"><h2>How to perform this workout</h2>${instructions}</section>` : ""}${tips ? `<section class="panel workout-html"><h2>Coach tips</h2>${tips}</section>` : ""}<dialog id="player" aria-label="Workout player"><div class="dialog-top"><strong>${escapeHtml(workout.name)}</strong><button data-close="player" aria-label="Close player">✕</button></div><div class="dialog-body player-content"><p class="progress" id="player-progress"></p><div id="player-body"></div><div class="player-controls"><button id="previous">← Previous</button><button id="sound">Sound off</button><button class="primary" id="next">Next →</button></div></div></dialog><dialog id="exercise-detail" aria-label="Exercise details"><div class="dialog-top"><strong>Exercise details</strong><button data-close="exercise-detail" aria-label="Close exercise details">✕</button></div><div class="dialog-body" id="exercise-body"></div></dialog>`;
  // Only the explicit read-only payload is exported; member email, IDs, logs and history never enter it.
  return { name: `${exerciseFilename(workout)}.html`, html: htmlDocument(workout.name, body, `const DATA=${safeJson({ slides, exercises })};${PLAYER_SCRIPT}`) };
}