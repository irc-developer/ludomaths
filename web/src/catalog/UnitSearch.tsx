import { useEffect, useId, useRef, useState } from 'react';
import { s } from '../i18n/scenario';
import { scenarioInput } from '../calculators/combat/scenarioStyles';

interface Option { id: string; name: string; detail: string }
interface Props { label: string; options: Option[]; selectedId?: string; onSelect: (id: string) => void }
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Browsing suggestions never commits a new scenario. */
export function UnitSearch({ label, options, selectedId, onSelect }: Props) {
  const id = useId();
  const selected = options.find(option => option.id === selectedId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const activeOptions = useRef<Array<HTMLLIElement | null>>([]);
  const needle = normalize(query);
  const score = (name: string) => normalize(name) === needle ? 0 : normalize(name).startsWith(needle) ? 1 : 2;
  const matches = options.filter(option => normalize(option.name).includes(needle))
    .sort((a, b) => score(a.name) - score(b.name) || a.name.localeCompare(b.name));
  const visible = matches.slice(0, 8);
  useEffect(() => { activeOptions.current[active]?.scrollIntoView?.({ block: 'nearest' }); }, [active, query]);
  function close() { setOpen(false); setActive(-1); }
  function commit(option: Option) { onSelect(option.id); close(); }
  return <div className="unit-search">
    <label htmlFor={id}>{label}</label>
    <input id={id} role="combobox" autoComplete="off" style={scenarioInput}
      aria-autocomplete="list" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
      aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
      value={open ? query : selected?.name ?? ''} placeholder={s('searchPlaceholder')}
      onFocus={() => { setQuery(''); setOpen(true); setActive(-1); }} onBlur={close}
      onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          if (visible.length === 0) { setActive(-1); return; }
          setActive(previous => event.key === 'ArrowDown' ? Math.min(previous + 1, visible.length - 1) : Math.max(previous - 1, 0));
        }
        if (event.key === 'Enter' && open && visible[active]) { event.preventDefault(); commit(visible[active]); }
      }} />
    {open && <div className="search-popup">
      <ul id={`${id}-list`} role="listbox" aria-label={label}>
        {visible.map((option, index) => <li key={option.id} ref={element => { activeOptions.current[index] = element; }} id={`${id}-option-${index}`} role="option"
          aria-selected={selectedId === option.id} className={active === index ? 'active' : ''}
          onMouseDown={event => event.preventDefault()} onClick={() => commit(option)}>
          <span>{option.name}</span> <small>{option.detail}</small>
        </li>)}
      </ul>
      <p role="status">{matches.length === 0 ? s('noMatches') : `${matches.length} ${s(matches.length === 1 ? 'match' : 'matches')}`}
        {matches.length > visible.length && <span> · {s('refineSearch')}</span>}</p>
    </div>}
  </div>;
}
