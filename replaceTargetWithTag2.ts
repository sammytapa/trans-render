import {RenderContext} from './types2.js';
/**
 * 
 * @param target 
 * @param template 
 */
export function replaceTargetWithTag<TargetType extends HTMLElement | SVGElement = HTMLElement, ReplacingTagType extends HTMLElement | SVGElement = HTMLElement>
    (target: TargetType, ctx: RenderContext, tag: string, preSwapCallback?: (el: ReplacingTagType) => void){
    const tagEl = document.createElement(tag) as ReplacingTagType;
    ctx.replacedElement = target;
    target.dataset.deleteMe = 'true';
    if(preSwapCallback) preSwapCallback(tagEl);
    target.insertAdjacentElement('afterend', tagEl);
}