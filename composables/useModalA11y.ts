import type { Ref } from 'vue';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Accesibilidad de un modal: mueve el foco al abrir, lo mantiene dentro
 * del dialogo con Tab, cierra con Escape y devuelve el foco al cerrar.
 */
export function useModalA11y(isOpen: Ref<boolean>, container: Ref<HTMLElement | null>, close: () => void) {
  let previouslyFocused: HTMLElement | null = null;

  function focusables(): HTMLElement[] {
    if (!container.value) return [];
    return Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isOpen.value) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === container.value)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  watch(isOpen, async (open) => {
    if (!import.meta.client) return;
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', onKeydown);
      await nextTick();
      // Esperar a que termine la transicion de entrada
      requestAnimationFrame(() => {
        // El dialogo mismo recibe el foco (tabindex=-1): el lector de pantalla
        // anuncia su titulo y no aparece un anillo de foco sobre el boton cerrar
        const target = container.value?.querySelector<HTMLElement>('[autofocus]') || container.value || focusables()[0];
        target?.focus();
      });
    } else {
      document.removeEventListener('keydown', onKeydown);
      previouslyFocused?.focus?.();
      previouslyFocused = null;
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    if (import.meta.client) document.removeEventListener('keydown', onKeydown);
  });
}
