export function insertAdjacentTemplate(template: HTMLTemplateElement, target: Element, position: InsertPosition){
    const clone = document.importNode(template.content, true);
    let appendTarget = target;
    let isFirst = true;
    Array.from(clone.children).forEach(child =>{
      const modifiedPosition : InsertPosition = isFirst ? position : 'afterend';
      isFirst = false;
      appendTarget = appendTarget.insertAdjacentElement(modifiedPosition, child)!;
    })
}