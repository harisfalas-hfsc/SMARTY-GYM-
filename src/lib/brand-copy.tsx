import { Link } from "@tanstack/react-router";

/**
 * Single source of truth for the gym description shown on the homepage
 * (desktop hero) and the About page. Edit here and both update together.
 */
export function GymDescription() {
  return (
    <>
      Smarty Gym is your online gym anywhere, anytime. Tell your coach how you
      feel, what you want to achieve and what you have to train with — and get
      a complete properly programmed session built for you, whenever and
      wherever you train. Built on the sports science and training philosophy
      of{" "}
      <Link
        to="/haris-falas"
        className="whitespace-nowrap font-semibold text-primary underline underline-offset-2"
      >
        Sports Scientist Haris Falas
      </Link>
      .
    </>
  );
}
