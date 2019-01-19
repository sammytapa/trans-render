import {RenderContext, init, TransformRules} from './init.js';

export function integrate(template: HTMLTemplateElement, target : Element, ctx: RenderContext, transform: TransformRules){
    if (ctx.update !== undefined) {
        //ctx.matchFirstChild = true;
    } else {
        init(template, {
            transform: transform
        }, target);
    }

}