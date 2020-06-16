import { transform } from './transform.js';
export const countKey = Symbol.for('04efa75f-dec8-4002-a091-153683691bd1'); //what a waste of bandwidth
export const itemsKey = Symbol.for('bb247496-9c5d-459c-8127-fe80fee8c256');
export const idxKey = Symbol.for('ad7cf100-0c10-4184-b836-f560f2c15c81');
export const ubKey = Symbol.for('7c6fd3aa-eea3-478c-b18c-32132b1bfc7c');
export async function repeatInit(template, ctx, items, target, targetTransform) {
    if (ctx.mode === 'update')
        return;
    const count = items.length;
    target[countKey] = count;
    target[ubKey] = count;
    target.dataset.iah = 'hi';
    const ctxClone = Object.assign({}, ctx);
    ctxClone.Transform = targetTransform;
    for (let i = 0; i < count; i++) {
        ctxClone.item = items[i];
        ctxClone.idx = i;
        await transform(template, ctxClone, target);
        // Array.from(clonedTemplate.children).forEach(templateChild =>{
        //     (<any>templateChild)[idxKey] = i;
        //     if(itemsProvided) (<any>templateChild)[itemsKey] = (countOrItems as any[])[i];
        // });
        //keep count to last batch, then update all children from last batch
    }
}