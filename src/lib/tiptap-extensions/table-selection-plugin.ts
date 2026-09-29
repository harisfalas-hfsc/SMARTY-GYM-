import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const tableSelectionPluginKey = new PluginKey('tableSelection');

export function createTableSelectionPlugin() {
  return new Plugin({
    key: tableSelectionPluginKey,

    state: {
      init() {
        return {
          selectedTable: null as number | null,
          decorations: DecorationSet.empty,
        };
      },

      apply(tr, value, oldState, newState) {
        const { selection } = newState;
        const { $anchor } = selection;

        // Find if cursor is inside a table
        let selectedTable: number | null = null;
        let depth = $anchor.depth;

        while (depth > 0) {
          const node = $anchor.node(depth);
          if (node.type.name === 'table') {
            selectedTable = $anchor.before(depth);
            break;
          }
          depth--;
        }

        // Create decorations for selected table
        let decorations = DecorationSet.empty;
        if (selectedTable !== null) {
          // Find the table wrapper if it exists
          let wrapperPos = selectedTable;
          let wrapperDepth = depth;
          
          while (wrapperDepth > 0) {
            const node = $anchor.node(wrapperDepth - 1);
            if (node.type.name === 'tableWrapper') {
              wrapperPos = $anchor.before(wrapperDepth - 1);
              break;
            }
            wrapperDepth--;
          }

          decorations = DecorationSet.create(newState.doc, [
            Decoration.node(wrapperPos, wrapperPos + newState.doc.nodeAt(wrapperPos)!.nodeSize, {
              class: 'table-selected',
            }),
          ]);
        }

        return {
          selectedTable,
          decorations,
        };
      },
    },

    props: {
      decorations(state) {
        return this.getState(state)?.decorations;
      },

      handleDOMEvents: {
        // Add drag and drop support in future iterations
        mousedown(view, event) {
          const target = event.target as HTMLElement;
          
          // Check if clicking on drag handle
          if (target.classList.contains('table-drag-handle')) {
            // Implement drag logic
            return true;
          }

          return false;
        },
      },
    },
  });
}
