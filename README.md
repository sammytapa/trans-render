# trans-render

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/trans-render)

<a href="https://nodei.co/npm/trans-render/"><img src="https://nodei.co/npm/trans-render.png"></a>

<img src="https://badgen.net/bundlephobia/minzip/trans-render">

trans-render provides an alternative way of instantiating a template.  It draws inspiration from the (least) popular features of xslt.  Like xslt, trans-render performs transforms on elements by matching tests on elements.  Whereas xslt uses xpath for its tests, trans-render uses css path tests via the element.matches() and element.querySelector() methods.

XSLT can take pure XML with no formatting instructions as its input.  Generally speaking, the XML that XSLT acts on isn't a bunch of semantically  meaningless div tags, but rather a nice semantic document, whose intrinsic structure is enough to go on, in order to formulate a "transform" that doesn't feel like a hack.  

Likewise, with the advent of custom elements, the template markup will tend to be much more semantic, like XML. trans-render tries to rely as much as possible on this intrinisic semantic nature of the template markup, to give enough clues on how to fill in the needed "potholes" like textContent and property setting.  But trans-render is completely extensible, so it can certainly accommodate custom markup (like string interpolation, or common binding attributes) by using additional, optional helper libraries.  

This leaves the template markup quite pristine, but it does mean that the separation between the template and the binding instructions will tend to require looking in two places, rather than one.  And if the template document structure changes, separate adjustments may needed to make the binding rules in sync.  Much like how separate style rules would eed adjusting.

## Advantages

By keeping the binding separate, the same template can thus be used to bind with different object structures.

Providing the binding transform in JS form inside the init function signature has the advantage that one can benefit from TypeScript typing of Custom and Native DOM elements with no additional IDE support.  

Another advantage of separating the binding like this, is that one can insert comments, console.log's and/or breakpoints, in order to walk through the binding process.


For more musings on the question of what is this good for, please see the [rambling section](https://github.com/bahrus/trans-render#ramblings-from-the-department-of-faulty-analogies) below.


## Workflow

trans-render provides helper functions for cloning a template, and then walking through the DOM, applying rules in document order.  Note that the document can grow, as processing takes place (due, for example, to cloning sub templates).  It's critical, therefore, that the processing occur in a logical order, and that order is down the document tree.  That way it is fine to append nodes before continuing processing.  

For each matching element, after modifying the node, you can instruct the processor to move to the next element sibling and/or the first child of the current one, where processing can continue.  You can also "cut to the chase" by "drilling" inside based on querySelector, but there's no going back to previous elements once that's done.  The syntax for the third option is shown below for the simplest example.  If you select the drill option, that trumps instructing trans-render to process the first child.

It is deeply unfortunate that the DOM Query Api doesn't provide a convenience function for [finding the next sibling](https://gomakethings.com/finding-the-next-and-previous-sibling-elements-that-match-a-selector-with-vanilla-js/) that matches a query, similar to querySelector. Just saying.  But some support for "cutting to the chase" laterally is provided.

At this point, only a synchronous workflow is provided.

## Syntax:

```html
<template id="test">
    <details>
        ...
        <summary></summary>
        ...
    </details>
</template>
<div id="target"></div>
<script type="module">
    import { init } from '../init.js';
    const model = {
        summaryText: 'hello'
    }
    const Transform = {
        details: {
            summary: x => model.summaryText
        }
    };
    init(sourceTemplate, { Transform }, target);
</script>
```

Produces

```html
<div id="target">
    <details>
        ...
        <summary>hello</summary>
        ...
    </details>
</div>
```

"target" is the HTML element we are populating.  The transform matches can return a string, which will be used to set the textContent of the target.  Or the transform can do its own manipulations on the target element, and then return an object specifying where to go next.

Note the unusual casing, in the JavaScript arena:  property Transform uses a capital T.  As we will see, this pattern is to allow the interpreter to distinguish between css matches and a "NextStep" JS object.


# Use Case 1:  Applying the DRY principle to (post) punk rock lyrics

## Example 1a (only viewable at [webcomponents.org](https://www.webcomponents.org/element/trans-render) )

<!--
```
<custom-element-demo>
<template>
    <div>
        <a href="https://www.youtube.com/watch?v=2-Lb-JhsaEk" target="_blank">Something's gone wrong again</a>
        <template id="Title">Something's gone wrong again</template>
        <template id="Title2">Something goes wrong again</template>
        <template id="Again">And again</template>
        <template id="Again2">And again, and again, again and something's gone wrong again</template>
        <template id="Again3">And again, and again, again and something goes wrong again</template>
        <template id="Agains">
            <span data-init="Again"></span><br>
            <span data-init="Again2"></span><br>
            <span data-init="Title"></span>
        </template>
        <template id="Agains2">
            <span data-init="Title2"></span><br>
            <span data-init="Again"></span><br>
            <span data-init="Again3"></span><br>
            <span data-init="Title2"></span>
        </template>
        <template id="bus">
            <span>Nothing ever happens to people like us</span><br>
            <span>'Cept we miss the bus, something goes wrong again</span><br>
            <span>Need a smoke, use my last fifty P.</span><br>
            <span>But the machine is broke, something's gone wrong again</span>
        </template>
        <template id="Main">
            <div>
                <span>Tried to find my sock</span><br>
                <span>No good, it's lost</span><br>
                <span data-init="Title"></span><br>
                <span>Need a shave</span><br>
                <span>Cut myself, need a new blade</span><br>
                <span data-init="Title"></span>
            </div>
            <div data-init="Agains"></div>
            <div>
                <span>Tried to fry an egg</span><br>
                <span>Broke the yolk, no joke</span><br>
                <span data-init="Title"></span><br>
                <span>Look at my watch, just to tell the time but the hand's come off mine</span><br>
                <span data-init="Title"></span><br>
                <span data-init="Title"></span>
            </div>
            <div data-init="Agains"></div>
            <div data-init="bus"></div>
            <div data-init="Agains2"></div>
            <div data-init="Agains2"></div>
            <div data-init="bus"></div>
            <div data-init="Agains2"></div>
            <div>
                <span>I turned up early in time for our date</span><br>
                <span>But then you turn up late, something goes wrong again</span><br>
                <span>Need a drink, go to the pub</span><br>
                <span>But the bugger's shut, something goes wrong again</span>
            </div>
            <div>
                <span data-init="Title2"></span><br>
                <span data-init="Again"></span><br>
                <span data-init="Again3"></span><br>
                <span>Ah, something goes wrong again</span><br>
                <span data-init="Title2"></span><br>
                <span data-init="Title2"></span>
            </div>
            <style>
                div{
                    padding-top:20px;
                }
            </style>
        </template>
        <div id="target"></div>
        <script type="module">
            import { init } from 'https://cdn.jsdelivr.net/npm/trans-render@0.0.44/init.js';
            init(Main, {
                Transform: {
                    '*': x  => ({
                        Select: '*'
                    }),
                    '[data-init]': ({target, ctx}) =>{
                        init(self[target.dataset.init], {}, target);
                    }
                }
            }, target);
        </script>
    </div>
</template>
</custom-element-demo>
```
-->

Note the transform rule above (if viewed from webcomponents.org):

```JavaScript
Transform: {
    '*': x  => ({
        Select: '*'
    }),
```

* is a match for all css elements.  What this is saying is "for any element regardless of css characters, continue processing its first child (Select => querySelector).  This, combined with the default setting to match all the next siblings means that, for a "sparse" template with very few pockets of dynamic data, you will be doing a lot more processing than needed.  But for initial, pre-optimization work, this transform rule can be a convenient way to get things done more quickly.  

[More documentation to follow]

<!--
# Reapplying (some) of the transform

Often, we want to reapply a transform, after something changes -- typically the source data.

The ability to do this is illustrated in the previous example.  Critical syntax shown below:

```html
<script type="module">
    import { init } from '../init.js';
    import { interpolate } from '../interpolate.js';
    import {update} from '../update.js';
    const ctx = init(Main, {
        model:{
            Day1: 'Monday', Day2: 'Tuesday', Day3: 'Wednesday', Day4: 'Thursday', Day5: 'Friday',
            Day6: 'Saturday', Day7: 'Sunday',
        },
        interpolate: interpolate,
        $: id => window[id],
    }, target);
    changeDays.addEventListener('click', e=>{
        ctx.model = {
            Day1: 'måndag', Day2: 'tisdag', Day3: 'onsdag', Day4: 'torsdag', Day5: 'fredag',
            Day6: 'lördag', Day7: 'söndag',
        }
        update(ctx, target);
    })
</script>
```


#  Loop support (NB:  Not yet optimized, not thoroughly tested)

The next big use case for this library is using it in conjunction with a [virtual scroller](https://valdrinkoshi.github.io/virtual-scroller/#more-examples). As far as I can see, the performance of this library should work quite well in that scenario.

However, no self respecting rendering library would be complete without some internal support for repeating lists.  This library is no exception.  While the performance of the initial list is likely to be acceptable, no effort has yet been made to utilize state of the art tricks to make list updates keep the number of DOM changes at a minimum. 

Anyway the syntax is shown below:

```html
<div>
    <template id="itemTemplate">
        <li></li>
    </template>
    <template id="list">
        <ul id="container"></ul>
        <button id="addItems">Add items</button>
    </template>
    <div id="target"></div>

    <script type="module">
        import { init } from '../init.js';
        import { update } from '../update.js';
        import { repeatInit } from '../repeatInit.js';
        import { repeatUpdate } from '../repeatUpdate.js';
        const ctx = init(list, {
            transform: {
                'ul': ({ target, ctx }) => {
                    if (!ctx.update) {
                        repeatInit(10, itemTemplate, target);
                    }
                    return {
                        matchFirstChild: {
                            'li': ({ target, idx }) => {
                                target.textContent = 'Hello ' + idx;
                                return {
                                    matchNextSib: true
                                }
                            }
                        }
                    }

                }
            }
        }, target);
        addItems.addEventListener('click', e => {
            repeatUpdate(15, itemTemplate, container);
            update(ctx, target);
        });
    </script>
</div>
```
-->

## Ramblings From the Department of Faulty Analogies

When defining an HTML based user interface, the question arises whether styles should be inlined in the markup or kept separate in style tags and/or CSS files.

The ability to keep the styles separate from the HTML does not invalidate support for inline styles.  The browser supports both, and probably always will.

Likewise, arguing for the benefits of this library is not in any way meant to disparage the usefulness of the current prevailing orthodoxy of including the binding / formatting instructions in the markup.  I would be delighted to see the [template instantiation proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md), with support for inline binding, added to the arsenal of tools developers could use.  Should that proposal come to fruition, this library, hovering under 1KB, would be in competition with one that is 0KB, with the full backing / optimization work of Chrome, Safari, Firefox.  Why would anyone use this library then?

And in fact, the library described here is quite open ended.  Portions of the templates can invoke any custom function to be populated.  Or it could use browser-provided template instantation up to a point, and this library for more light-touch "macro" binding.

For example, in the second example above, this library has nothing to offer in terms of string interpolation, since CSS matching provides no help:

```html
<div>Hello {{Name}}</div>
```

As this is a fundamental use case for template instantiation, it could be used as a first round of processing.  And where it makes sense to tightly couple the binding to the template, use it there as well.  Just as the use of inline styles is thriving.  But supplment that binding with this library.

A question in my mind, is how does this rendering approach fit in with web components (I'm going to take a leap here and assume that [HTML Modules / Imports](https://github.com/w3c/webcomponents/issues/645) in some form makes it into browsers, even though I think the discussion still has some relevance without that).

I think this alternative approach can provide value, in that the binding rules are data elements.  A web component can be based on one main template, but which requires inserting other satellite templates (repeatedly).  It can then define a base binding, which extending web components or even end consumers can then extend and/or override.

Adding the ability for downstream consumers to override "sub templates" should probably come towards the end of development, together with optimizing, as it could break up the rhythm somewhat in following along the flow of the markup.  Nevertheless, in the markup below, based from this [custom element](https://www.webcomponents.org/element/wc-info) we provide suggestions for how this can be done.  

The web component needs to display two nested lists inside a main component -- the list of web components contained inside an npm package, and for each web component, a list of the attributes.  It is natural to separate each list container into a sub template:

```JavaScript
const attribTemplate = createTemplate(/* html */ `
    <dt></dt><dd></dd>
`);

const WCInfoTemplate = createTemplate(/* html */ `
<section class="WCInfo card">
    <header>
        <div class="WCLabel"></div>
        <div class="WCDesc"></div>
    </header>
    <details>
        <summary>attributes</summary>
        <dl></dl>
    </details> 
</section>`);


const mainTemplate = createTemplate(/* html */ `
<header>
    <mark></mark>
    <nav>
        <a target="_blank">⚙️</a>
    </nav>
</header>
<main></main>
`);
```

**NB**  The syntax above will look much cleaner when HTML Modules are a thing.

The most "readable" binding is one which follows the structure of the output:

```TypeScript
  {
    Transform: {
      header: {
        mark: x => this.packageName,
        nav: {
          a: ({ target }) => {
            (target as HTMLAnchorElement).href = this._href!;
          }
        }
      } as TransformRules,
      main: ({ target }) => {
        const tags = this.viewModel.tags;
        repeatInit(tags.length, WCInfoTemplate, target);
        return {
          section: ({ idx }) => ({
            header: {
              ".WCLabel": x => tags[idx].label,
              ".WCDesc": ({ target }) => {
                target.innerHTML = tags[idx].description;
              }
            },
            details: {
              dl: ({ target }) => {
                const attrbs = tags[idx].attributes;
                if (!attrbs) return;
                repeatInit(attrbs.length, attribTemplate, target);
                return {
                  dt: ({ idx }) => attrbs[Math.floor(idx / 2)].label,
                  dd: ({ idx }) => attrbs[Math.floor(idx / 2)].description
                };
              }
            }
          })
        };
      }
    } as TransformRules
  };

```

However, this would be difficult for extending or consuming components to finesse (if say they want to bind some additional information inside one of the existing tags).

The rule of thumb I suggest is to break things down by template, thusly:

```TypeScript
export const subTemplates = {
  attribTransform:'attribTransform',
  WCInfo: 'WCInfo'
} 
export class WCInfoBase extends XtalElement<WCSuiteInfo> {
  _renderContext: RenderContext = {
    init: init,
    refs:{
      [subTemplates.attribTransform]: (attrbs: AttribInfo[]) => ({
        dt: ({ idx }) => attrbs[Math.floor(idx / 2)].label,
        dd: ({ idx }) => attrbs[Math.floor(idx / 2)].description
      } as TransformRules),
      [subTemplates.WCInfo]: (tags: WCInfo[], idx: number) =>({
        
          header: {
            ".WCLabel": x => tags[idx].label,
            ".WCDesc": ({ target }) => {
              target.innerHTML = tags[idx].description;
            }
          },
          details: {
            dl: ({ target, ctx }) => {
              const attrbs = tags[idx].attributes;
              if (!attrbs) return;
              repeatInit(attrbs.length, attribTemplate, target);
              return ctx.refs![subTemplates.attribTransform](attrbs); 
            }
          }
      } as TransformRules)
    },
    Transform: {
      header: {
        mark: x => this.packageName,
        nav: {
          a: ({ target }) => {
            (target as HTMLAnchorElement).href = this._href!;
          }
        }
      } as TransformRules,
      main: ({ target }) => {
        const tags = this.viewModel.tags;
        repeatInit(tags.length, WCInfoTemplate, target);
        return ({
          section: ({ idx, ctx }) => ctx.refs![subTemplates.WCInfo](tags, idx),
        })
      }
    }
  };
```

## Why not just create a method for each template, and allow consumers to override it?

Of course, that's a respectable approach.  However:

1.  This will only allow extending components, rather than web compositions that consume the web component, to override the default behavior.
2.  It's difficult / impossible to insert something inside a method when overriding, only doing something before and/or after.

Granted, in the (quite realistic) example provided above, overriding / extending the binding is not as easy as it could be in other circumstances -- 
due to the fact that the sub template bindings are functions, as opposed to objects.  But I see a path where it would work, by invoking the function, and *then* massaging the TransformRules, which is now an easy to understand (?) JavaScript object, similar to a CSS Stylesheet.

And to be sure, template literals also break down into (harder to understand?) pieces, based around bindings.  I'm a bit unclear here.  If Template Literal results are really as easy to customize as this approach, then the remaining advantage for this approach is simply the faster parsing speeds of HTML vs JavaScript strings -- something observable today with HTML heavy components / pages, and that *may* carry over to HTML modules.  

