import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../types';
const ROLES = ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'];
export function RoleSelector({ value, onChange, disabled }) {
    return (<select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} title={ROLE_DESCRIPTIONS[value]} className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-ink-700 hover:border-border focus:border-accent focus:outline-none disabled:appearance-none disabled:hover:border-transparent">
      {ROLES.map((role) => (<option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>))}
    </select>);
}
