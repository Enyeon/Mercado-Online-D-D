








export function createSectionedItemList({ title, itemListClassName = 'inventory-sections' }) {
    const section = document.createElement('section');
    section.className = 'inventory-section';

    const heading = document.createElement('h3');
    heading.className = 'inventory-section-title';
    heading.textContent = title;

    const list = document.createElement('div');
    list.className = itemListClassName;

    section.append(heading, list);

    return { section, list };
}
