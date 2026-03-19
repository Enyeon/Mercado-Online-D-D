








export function bindWarningModal(modal) {
    const titleEl = modal.querySelector('#warning-title');
    const textEl = modal.querySelector('#warning-text');
    const confirmBtn = modal.querySelector('#warning-confirm');
    const cancelBtn = modal.querySelector('#warning-cancel');

    return function ask({ title, message }) {
        titleEl.textContent = title;
        textEl.textContent = message;
        modal.classList.remove('hidden');

        return new Promise((resolve) => {
            const cleanup = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            };

            const onConfirm = () => {
                cleanup();
                modal.classList.add('hidden');
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                modal.classList.add('hidden');
                resolve(false);
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    };
}
