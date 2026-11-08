'use client';

import { useEffect } from 'react';

/**
 * Keyboard and pointer behaviour for the header menus (native <details> in the
 * server HTML): one open at a time, Esc closes (focus back on the toggle),
 * outside click closes, ArrowDown on a toggle opens it and focuses the first
 * link, ↑↓ move between links, a link tap closes. Renders nothing.
 */
export function HeaderMenus() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;
    const menus = Array.from(header.querySelectorAll<HTMLDetailsElement>('details[data-menu]'));
    const links = (d: HTMLDetailsElement) =>
      Array.from(d.querySelectorAll<HTMLElement>('[data-menu-panel] a, [data-menu-panel] button, [data-menu-panel] input'));
    const closeAll = (except?: HTMLDetailsElement) => {
      for (const m of menus) if (m !== except && m.open) m.open = false;
    };
    const lock = () =>
      document.documentElement.classList.toggle(
        'sheet-open',
        menus.some((m) => m.open && m.dataset.menu === 'mobile'),
      );

    const onToggle = (e: Event) => {
      const d = e.currentTarget as HTMLDetailsElement;
      if (d.open) closeAll(d);
      lock();
    };
    const onKey = (e: KeyboardEvent) => {
      const open = menus.find((m) => m.open);
      const target = e.target as HTMLElement;
      const summary = target.closest('summary');
      const menu = target.closest<HTMLDetailsElement>('details[data-menu]');
      if (e.key === 'Escape' && open) {
        open.open = false;
        open.querySelector('summary')?.focus();
        return;
      }
      if (!menu) return;
      if (summary && e.key === 'ArrowDown') {
        e.preventDefault();
        menu.open = true;
        links(menu)[0]?.focus();
        return;
      }
      if (!summary && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && target.tagName === 'A') {
        const list = links(menu).filter((el) => el.tagName === 'A');
        const i = list.indexOf(target);
        if (i < 0) return;
        e.preventDefault();
        list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      for (const m of menus) if (m.open && !m.contains(t)) m.open = false;
      lock();
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (a && a.closest('[data-menu-panel]')) closeAll();
      lock();
    };

    for (const m of menus) m.addEventListener('toggle', onToggle);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    header.addEventListener('click', onClick);
    return () => {
      for (const m of menus) m.removeEventListener('toggle', onToggle);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      header.removeEventListener('click', onClick);
      document.documentElement.classList.remove('sheet-open');
    };
  }, []);
  return null;
}
