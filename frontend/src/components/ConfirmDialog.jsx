import { Modal } from './Modal';
import { Button } from './Button';
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', destructive = true, busy = false, onConfirm, onCancel, }) {
    return (<Modal open={open} onClose={onCancel} title={title} description={description} width="sm" footer={<>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={destructive ? 'danger-filled' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>}>
      <></>
    </Modal>);
}
