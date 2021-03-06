import {
    RenderContext, 
    RenderOptions, 
    NextStep, 
    TransformValueOptions, 
    TransformMatch,
    TransformValueObjectOptions,
    TransformValueArrayOptions,
    ATRIUM_Loop,
    PEATUnionSettings,
    InitTransform,
    UpdateTransform,
    Plugin,
    CATMINT_Conditional
} from './types2.js';

import {doNextStepSelect, copyCtx, doNextStepSibling, processEl, restoreCtx, getProp, isTemplate, processSymbols} from './transform.js';

//export const repeatethFnContainer: IRepeatethContainer = {};

function doTransform(ctx: RenderContext, tvoo: TransformValueObjectOptions){
        const ctxCopy = copyCtx(ctx);
        ctx.Transform = tvoo; //TODO -- don't do this line if this is a property setting
        const keys = Object.keys(tvoo);
        if(keys.length !== 0){
          const firstCharOfFirstProp = keys[0][0];
          let isNextStep = "SNTM".indexOf(firstCharOfFirstProp) > -1;
          ctx.previousTransform = ctxCopy.Transform;
          if(isNextStep){
              doNextStepSelect(ctx);
              doNextStepSibling(ctx);
          }else{
              ctx.target = ctx.target!.firstElementChild as HTMLElement;
              ctx.level!++;
              ctx.idx = 0;
              processEl(ctx);
              processSymbols(ctx);
          }
          delete ctx.previousTransform;
        }
        restoreCtx(ctx, ctxCopy);
}

export function doObjectMatch(key: string, tvoo: TransformValueObjectOptions, ctx: RenderContext){
    if(Array.isArray(tvoo)){
        doArrayMatch(key, tvoo as TransformValueArrayOptions, ctx);
    }else{
        if(isTemplate(tvoo as HTMLTemplateElement)){
            doTemplate(ctx, tvoo as HTMLTemplateElement);
            return;
        }

        doTransform(ctx, tvoo);
    }
}



const lastTempl = Symbol();
function doTemplate(ctx: RenderContext, te: HTMLTemplateElement){
    const target = ctx.target!;
    if((<any>target)[lastTempl] !== undefined &&   (<any>target)[lastTempl] === (<any>te)[lastTempl]) return;
    const useShadow = te.dataset.shadowRoot !== undefined;
    const clone = te.content.cloneNode(true);
    let fragmentTarget : Node = target;
    if(useShadow){
      if(target.shadowRoot === null){
        target.attachShadow({mode: te.dataset.shadowRoot as 'open' | 'closed', delegatesFocus: true});
      }else{
        target.shadowRoot.innerHTML = '';
      }
      fragmentTarget = target.shadowRoot!;
    }else if(te.dataset.isSingle){
      target.innerHTML = '';
    }
    fragmentTarget.appendChild(clone);
}

function doArrayMatch(key: string, tvao: TransformValueArrayOptions, ctx: RenderContext){
    const firstEl = tvao[0];
    switch(typeof firstEl){
        case 'undefined':
        case 'object':
            if(Array.isArray(firstEl)){
                doRepeat(key, tvao as ATRIUM_Loop, ctx); 
            }else{
                doPropSetting(key, tvao as PEATUnionSettings, ctx);
            }
            break;
        case 'boolean':
            doCondition(key, tvao as CATMINT_Conditional, ctx);
            break;
        case 'symbol':
            ctx.plugins![firstEl as any as string].fn(ctx, tvao);
            break;
        case 'string':
          const el = document.createElement(firstEl);
          const target = ctx.target! as HTMLElement;
          const position = tvao[1];
          if(position !== undefined){
            if(position === 'replace'){
              //https://paulbakaus.com/2019/07/28/quickly-copy-dom-attributes-from-one-element-to-another/
              target.getAttributeNames().forEach(name =>{
                el.setAttribute(name, target.getAttribute(name)!);
              });
              target.dataset.deleteMe = 'true';
              target.insertAdjacentElement('afterend', el);
            }else{
              target.insertAdjacentElement(position, el);
            }
            
          }else{
            target.appendChild(el);
          }
          const peat = tvao[2];
          if(peat !== undefined){
            ctx.target = el;
            doPropSetting(key, peat as PEATUnionSettings, ctx);
            ctx.target = target;
          }
    }
}

function doCondition(key: string, cu: CATMINT_Conditional, ctx: RenderContext){
  const [conditionVal, affirmTempl, mi, negativeTempl] = cu;
  const templateToClone = conditionVal ? affirmTempl : negativeTempl; 
  if(templateToClone !== undefined){
    ctx.target!.appendChild(templateToClone.content.cloneNode(true));
  }
  if(mi !== undefined){
    const cache = ctx.host || ctx;
    if(mi.yesSym !== undefined){
      if(conditionVal){
        (<any>cache)[mi.yesSym as any as string] = ctx.target;
      }else{
        delete (<any>cache)[mi.yesSym as any as string];
      }
    }
    if(mi.noSym !== undefined){
      if(conditionVal){
        delete (<any>cache)[mi.noSym as any as string];
      }else{
        (<any>cache)[mi.noSym as any as string] = ctx.target;
      }
    }
    if(mi.eitherSym !== undefined){
      (<any>cache)[mi.eitherSym as any as string] = ctx.target;
    } 
  }
}

function doPropSetting(key: string, peat: PEATUnionSettings, ctx: RenderContext){
    const len = peat.length;
    const target = ctx.target as HTMLElement;
    if (len > 0) {
      //////////  Prop Setting
      /////////   Because of dataset, style (other?) assign at one level down
      const props = peat[0];
      if(props !== undefined){
        Object.assign(target, props);
        if(props.style !== undefined) Object.assign(target.style, props.style);
        if(props.dataset !== undefined) Object.assign(target.dataset, props.dataset);
      }
    }else{
      return;
    }
    if (len > 1) {
      /////////  Event Handling
      if(peat[1] !== undefined){
        const eventSettings = peat[1];
        for (const key in eventSettings) {
          let eventHandler = eventSettings[key];
          if(Array.isArray(eventHandler)){
            const objSelectorPath = eventHandler[1].split('.');
            const converter = eventHandler[2];
            const originalEventHandler = ctx.host !== undefined ? eventHandler[0].bind(ctx.host) : eventHandler[0];
            eventHandler = (e: Event) =>{
              let val = getProp(e.target, objSelectorPath);
              if(converter !== undefined) val = converter(val);
              originalEventHandler(val, e);
            }
          }else if(ctx.host !== undefined){
            eventHandler = eventHandler.bind(ctx.host);
          }
          target.addEventListener(key, eventHandler as EventListenerOrEventListenerObject);
        }
      }

    }else{
      return;
    }
    if (len > 2) {
      /////////  Attribute Setting
      if(peat[2] !== undefined){
        for (const key in peat[2]) {
          const val = peat[2][key];
          switch (typeof val) {
            case 'boolean':
              if (val) {
                target.setAttribute(key, '');
              } else {
                target.removeAttribute(key);
              }
              break;
            case 'string':
              target.setAttribute(key, val);
              break;
            case 'number':
              target.setAttribute(key, val.toString());
              break;
            case 'object':
              if(val === null) target.removeAttribute(key);
              break;
          }
        }
      }
    }else{
      return;
    }
    if(len > 3){
      if(peat[3] !== undefined){
        doTransform(ctx, peat[3] as TransformValueObjectOptions);
      }

    }else{
      return;
    }
    if(len > 4  && peat[4] !== undefined){
      ////////////// Symbol
      (ctx.host || ctx.cache)[peat[4]] = target;
    }

}

function doRepeat(key: string, atriums: ATRIUM_Loop, ctx: RenderContext){
    const mode = ctx.mode;
    const newMode = ctx.mode;
    const vm = ctx.viewModel;
    ctx.viewModel = atriums[0];
    const transform = ctx.repeatProcessor!(atriums[1], ctx, atriums[0], ctx.target!, atriums[3], atriums[4]);
    ctx.viewModel = vm;
}