export function init(template, ctx, target) {
    ctx.init = init;
    const clonedTemplate = template.content.cloneNode(true);
    ctx.template = clonedTemplate;
    if (ctx.transform) {
        const firstChild = clonedTemplate.firstElementChild;
        if (firstChild !== null) {
            ctx.leaf = firstChild;
            process(ctx, 0, 0);
        }
    }
    target.appendChild(ctx.template);
    return ctx;
}
function inheritTemplate(context, transform) {
    if (context.inheritMatches) {
        return Object.assign(Object.assign({}, context.transform), transform);
    }
    return transform;
}
export function process(context, idx, level) {
    const target = context.leaf;
    if (target.matches === undefined)
        return;
    const transform = context.transform;
    //context.matchFirstChild = false;
    //context.matchNextSib = false;
    //context.drill = null;
    let drill = null;
    let matchFirstChild = false;
    let matchNextSib = false;
    context.inheritMatches = false;
    for (const selector in transform) {
        if (target.matches(selector)) {
            const transformTemplate = transform[selector];
            const resp = transformTemplate({
                target: target,
                ctx: context,
                idx: idx,
                level: level
            });
            if (resp !== undefined) {
                if (resp.drill !== undefined) {
                    drill = drill === null ? resp.drill : Object.assign(drill, resp.drill);
                }
                if (resp.matchFirstChild !== undefined) {
                    switch (typeof resp.matchFirstChild) {
                        case 'boolean':
                            if (typeof matchFirstChild === 'boolean' && resp.matchFirstChild) {
                                matchFirstChild = true;
                            }
                            break;
                        case 'object':
                            if (typeof matchFirstChild === 'object') {
                                Object.assign(matchFirstChild, resp.matchFirstChild);
                            }
                            else {
                                matchFirstChild = resp.matchFirstChild;
                            }
                            break;
                    }
                }
                if (resp.matchNextSib !== undefined) {
                    switch (typeof resp.matchNextSib) {
                        case 'boolean':
                            if (typeof matchNextSib === 'boolean' && resp.matchNextSib) {
                                matchNextSib = true;
                            }
                            break;
                        case 'object':
                            if (typeof matchNextSib === 'object') {
                                Object.assign(matchNextSib, resp.matchNextSib);
                            }
                            else {
                                matchNextSib = resp.matchNextSib;
                            }
                            break;
                    }
                }
            }
        }
    }
    //const matchNextSib = context.matchNextSib;
    //const matchFirstChild = context.matchFirstChild;
    //const drill = (<any>context.drill) as TransformRules | null;
    if (matchNextSib) {
        let transform = context.transform;
        if (typeof (matchNextSib) === 'object') {
            context.transform = inheritTemplate(context, matchNextSib);
        }
        const nextSib = target.nextElementSibling;
        if (nextSib !== null) {
            context.leaf = nextSib;
            process(context, idx + 1, level);
        }
        context.transform = transform;
    }
    if (matchFirstChild || drill !== null) {
        let transform = context.transform;
        let nextChild;
        if (drill !== null) {
            const keys = Object.keys(drill);
            nextChild = target.querySelector(keys[0]);
            context.transform = inheritTemplate(context, drill);
        }
        else {
            nextChild = target.firstElementChild;
            if (typeof (matchFirstChild) === 'object') {
                context.transform = inheritTemplate(context, matchFirstChild);
            }
        }
        //const firstChild = target.firstElementChild;
        if (nextChild !== null) {
            context.leaf = nextChild;
            process(context, 0, level + 1);
        }
        context.transform = transform;
    }
    //context.matchFirstChild = matchFirstChild;
    //context.matchNextSib = matchNextSib;
}