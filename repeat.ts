import {TransformValueOptions, RenderContext} from './types.js';
import {repeatInit} from './repeatInit.js';
import {createTemplate} from './createTemplate.js';
import {repeatUpdate} from './repeatUpdate.js';
export function repeat(template: HTMLTemplateElement | [symbol, string], ctx: RenderContext, countOrItems: number | any[], target: HTMLElement, targetTransform?: TransformValueOptions){
    if(Array.isArray(template)) template = createTemplate(template[1], ctx, template[0]);
    if(ctx.update !== undefined){
        return repeatUpdate(template as HTMLTemplateElement, ctx, countOrItems, target, targetTransform)
    }else{
        return repeatInit(template as HTMLTemplateElement, ctx, countOrItems, target, targetTransform);
    }
}