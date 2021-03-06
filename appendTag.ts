import {DecorateArgs, PEAUnionSettings, PEATUnionSettings, RenderContext} from './types.js';
import {decorate} from './decorate.js';
import {applyPeatSettings} from './init.js';
export function appendTag<T extends HTMLElement = HTMLElement>(container: HTMLElement, name: string, config?: PEAUnionSettings<T> | DecorateArgs<T>, ctx?: RenderContext) : T{
    const newElement = document.createElement(name) as T;
    if(config !== undefined){
        if(Array.isArray(config) && ctx !== undefined){
            applyPeatSettings<T>(newElement, config as PEATUnionSettings<T>, ctx);
        }else{
            decorate(newElement, config as DecorateArgs<T>);
        }
        
    }
    container.appendChild(newElement);
    return newElement;
}
