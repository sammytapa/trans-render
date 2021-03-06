import {TransformValueOptions, RenderContext, ItemStatus} from './types.js';
import {repeatInit} from './repeatInit.js';
import {createTemplate} from './createTemplate.js';
import {repeatUpdate} from './repeatUpdate.js';
export function logansLoop(
    template: HTMLTemplateElement | [symbol, string], 
    ctx: RenderContext, 
    items: any[], 
    itemStatus: (a: any) => ItemStatus,
    target: HTMLElement, 
    initTransform: TransformValueOptions,
    updateTransform: TransformValueOptions = initTransform
    ){
    if(Array.isArray(template)) template = createTemplate(template[1], ctx, template[0]);
    if(ctx.update !== undefined){
        return repeatUpdate(template as HTMLTemplateElement, ctx, items, target, updateTransform)
    }else{
        return repeatInit(template as HTMLTemplateElement, ctx, items, target, initTransform);
    }
}