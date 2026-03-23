








const LIST_LAYOUT_CLASSES = ['item-list', 'inventory-sections'];

export function setListContainerLayout(container, layoutClassName) {
    container.classList.remove(...LIST_LAYOUT_CLASSES);
    container.classList.add(layoutClassName);
}
