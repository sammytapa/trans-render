# trans-render

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/trans-render)

<a href="https://nodei.co/npm/trans-render/"><img src="https://nodei.co/npm/trans-render.png"></a>

<img src="https://badgen.net/bundlephobia/minzip/trans-render">

trans-render provides an alternative way of instantiating a template.  It draws inspiration from the (least) popular features of xslt.  Like xslt, trans-render performs transforms on elements by matching tests on elements.  Whereas xslt uses xpath for its tests, trans-render uses css path tests via the element.matches() and element.querySelector() methods.

XSLT can take pure XML with no formatting instructions as its input.  Generally speaking, the XML that XSLT acts on isn't a bunch of semantically  meaningless div tags, but rather a nice semantic document, whose intrinsic structure is enough to go on, in order to formulate a "transform" that doesn't feel like a hack.  

Likewise, with the advent of custom elements, the template markup will tend to be much more semantic, like XML. trans-render tries to rely as much as possible on this intrinisic semantic nature of the template markup, to give enough clues on how to fill in the needed "potholes" like textContent and property setting.  But trans-render is completely extensible, so it can certainly accommodate custom markup (like string interpolation, or common binding attributes) by using additional, optional helper libraries.  

This leaves the template markup quite pristine, but it does mean that the separation between the template and the binding instructions will tend to require looking in two places, rather than one.

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
    const transform = {
        details: x => ({
            select: {
                summary: x => model.summaryText
            }
        })

    };
    init(test, { transform }, target);
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

By design, trans-render is loathe to do any unnessary work.  As mentioned earlier, each transform can specify whether to proceed to the next sibling, thusly:

```JavaScript
matchNextSib: true;
```

And/or it can specify to match the first child:

```JavaScript
matchFirstChild: true;
```

And, as we've seen, you can drill down until the first matching element is found (via querySelector)

```JavaScript
return {
    select: {
        'myCssQuery':{
            ...
        }
    }
}

```

The matchFirstChild return statement above can either be a boolean, as illustrated above, or they it can provide a new transform match:

```JavaScript
transform: {
    div: x => ({
        matchNextSib: true,
        matchFirstChild: {
            '*': x => ({
                 matchNextSib: true
            }),
            '[x-d]': ({ target}) => {
                interpolate(target, 'textContent', model);
            },
            '[data-init]': ({ target, ctx }) => {
                if (ctx.update !== undefined) {
                    return {
                        matchFirstChild: true
                    }
                } else {
                    init(self[target.dataset.init], {
                        transform: ctx.transform
                    }, target);
                }
            },
        }
    }),
}
```

Another return property: "nextMatch" can be used to skip over the next set of siblings until it finds a node matching the value of nextMatch.

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
            import { init } from 'https://cdn.jsdelivr.net/npm/trans-render@0.0.26/init.js';
            init(Main, {
                transform: {
                    '*': x  => ({
                        matchNextSib: true,
                        matchFirstChild: true
                    }),
                    '[data-init]': ({target, ctx}) =>{
                        ctx.init(self[target.dataset.init], {}, target);
                    }
                }
            }, target);
        </script>
    </div>
</template>
</custom-element-demo>
```
-->

## Example 1b (only viewable at [webcomponents.org](https://www.webcomponents.org/element/trans-render) )

<!--
```
<custom-element-demo>
<template>
    <div>
        <a href="https://www.youtube.com/watch?v=ucX9hVCQT_U" target="_blank">Friday I'm in Love</a><br>
        <button id="changeDays">Wi not trei a holiday in Sweeden this yer</button>
        <template id="Friday">
            <span x-d>It's |.Day5| I'm in love</span>
        </template>
        <template id="Opening">
            <span x-d>I don't care if |.Day1|'s blue</span><br>
            <span x-d>|.Day2|'s gray and |.Day3| too</span><br>
            <span x-d>|.Day4| I don't care about you</span><br>
            <span data-init="Friday"></span>
        </template>

        <template id="Main">
            <div data-init="Opening" class="stanza"></div>
            <div class="stanza">
                <span x-d>|.Day1| you can fall apart</span><br>
                <span x-d>|.Day2| |.Day3| break my heart</span><br>
                <span x-d>Oh, |.Day4| doesn't even start</span><br>
                <span data-init="Friday"></span>
            </div>
            <div class="stanza">
                <span x-d>|.Day6| wait</span><br>
                <span x-d>And |.Day7| always comes too late</span><br>
                <span x-d>But |.Day5| never hesitate</span>
            </div>

            <div class="stanza">
                <span x-d>I don't care if |.Day1|'s black</span><br>
                <span x-d>|.Day2|, |.Day3| heart attack</span><br>
                <span x-d>|.Day4| never looking back</span><br>
                <span data-init="Friday"></span>
            </div>
            <div class="stanza">
                <span x-d>|.Day1| you can hold your head</span><br>
                <span x-d>|.Day2|, |.Day3| stay in bed</span><br>
                <span x-d>Or |.Day4| watch the walls instead</span><br>
                <span data-init="Friday"></span>
            </div>
            <div class="stanza">
                <span x-d>|.Day6| wait</span><br>
                <span x-d>And |.Day7| always comes too late</span><br>
                <span x-d>But |.Day5| never hesitate</span>
            </div>
            <div class="stanza">
                <span>Dressed up to the eyes</span><br>
                <span>It's a wonderful surprise</span><br>
                <span>To see your shoes and your spirits rise</span><br>
                <span>Throwing out your frown</span><br>
                <span>And just smiling at the sound</span><br>
                <span>And as sleek as a shriek</span><br>
                <span>Spinning round and round</span><br>
                <span>Always take a big bite</span><br>
                <span>It's such a gorgeous sight</span><br>
                <span>To see you in the middle of the night</span><br>
                <span>You can never get enough</span><br>
                <span>Enough of this stuff</span><br>
                <span x-d>It's |.Day5|</span><br>
                <span>I'm in love</span>
            </div>
            <div data-init="Opening" class="stanza"></div>
            <div class="stanza">
                <span x-d>|.Day1| you can fall apart</span><br>
                <span x-d>|.Day2|, |.Day3| break my heart</span><br>
                <span x-d>|.Day4| doesn't even start</span><br>
                <span data-init="Friday"></span>
            </div>
            <style>
                .stanza{
                padding-top: 20px;
            }
        </style>
        </template>
        <div id="target"></div>

        <script type="module">
            import { init } from 'https://cdn.jsdelivr.net/npm/trans-render@0.0.26/init.js';
            import { interpolate } from 'https://cdn.jsdelivr.net/npm/trans-render@0.0.26/interpolate.js';
            import { update } from 'https://cdn.jsdelivr.net/npm/trans-render@0.0.26/update.js';
            let model = {
                Day1: 'Monday', Day2: 'Tuesday', Day3: 'Wednesday', Day4: 'Thursday', Day5: 'Friday',
                Day6: 'Saturday', Day7: 'Sunday',
            };
            const ctx = {
                divTransform:{
                    '*': x => ({
                        matchNextSib: true
                    }),
                    '[x-d]': ({ target }) => {
                        interpolate(target, 'textContent', model);
                    },
                    '[data-init]': ({ target, ctx }) => {
                        if (ctx.update !== undefined) {
                            return {
                                matchFirstChild: true
                            }
                        } else {
                            init(self[target.dataset.init], {
                                transform: ctx.transform
                            }, target);
                        }
                    },
                },
                transform: {
                    div: ({ ctx }) => ({
                        matchNextSib: true,
                        matchFirstChild: ctx.divTransform
                    }),
                }
            };
            init(Main, ctx, target);
            changeDays.addEventListener('click', e => {
                model = {
                    Day1: 'måndag', Day2: 'tisdag', Day3: 'onsdag', Day4: 'torsdag', Day5: 'fredag',
                    Day6: 'lördag', Day7: 'söndag',
                }
                update(ctx, target);
            })
        </script>
    </div>
</template>
</custom-element-demo>
```
-->

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


## Ramblings From the Department of Faulty Analogies

When defining an HTML based user interface, the question arises whether styles should be inlined in the markup or kept separate in style tags and/or CSS files.

The ability to keep the styles separate from the HTML does not invalidate support for inline styles.  The browser supports both, and probably always will.

Likewise, arguing for the benefits of this library is not in any way meant to disparage the usefulness of the current prevailing orthodoxy of including the binding / formatting instructions in the markup.  I would be delighted to see the [template instantiation proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md), with support for inline binding, added to the arsenal of tools developers could use.  Should that proposal come to fruition, this library, hovering under 1KB, would be in competition with one that is 0KB, with the full backing / optimization work of Chrome, Safari, Firefox.  Why would anyone use this library then?

A question in my mind, is how does this rendering approach fit in with web components (I'm going to take a leap here and assume that [HTML Modules / Imports](https://github.com/w3c/webcomponents/issues/645) in some form makes it into browsers, even though I think the discussion still has some relevance without that).

I think this alternative approach can provide value, in that the binding rules are data elements.  A web component can be based one main template, but which requires inserting other satellite templates (repeatedly).  It can then define a base binding, which extending web components or even end consumers can then extend and/or override.

In order to do this to maximum effect, we should make each of the "sub matching transforms" something that can be overwritten.  In particular, rather than doing this:

```JavaScript
const ctx = init(Main, {
    transform: {
        div: ({ ctx }) => ({
            matchNextSib: true,
            matchFirstChild: {
                '*': x => ({
                    matchNextSib: true
                }),
                '[x-d]': ({ target }) => {
                    interpolate(target, 'textContent', model);
                },
                '[data-init]': ({ target, ctx }) => {
                    if (ctx.update !== undefined) {
                        return {
                            matchFirstChild: true
                        }
                    } else {
                        init(self[target.dataset.init], {
                            transform: ctx.transform
                        }, target);
                    }
                },
            }
        }),
    }
}, target);
```

Do this:

```JavaScript
const ctx = {
    divTransform:{
        '*': x => ({
            matchNextSib: true
        }),
        '[x-d]': ({ target }) => {
            interpolate(target, 'textContent', model);
        },
        '[data-init]': ({ target, ctx }) => {
            if (ctx.update !== undefined) {
                return {
                    matchFirstChild: true
                }
            } else {
                init(self[target.dataset.init], {
                    transform: ctx.transform
                }, target);
            }
        },
    },
    transform:{
        div: ({ ctx }) => ({
            matchNextSib: true,
            matchFirstChild: ctx.divTransform
        }),
    }
}
init(Main, ctx, target);
```

Then if the web component exposes the context parameter as a property, it would allow extending components / end users to extend / modify / remove the default transform.

## Example: [Periodic Table](https://codepen.io/mikegolus/pen/OwrPgB)  Work In Progress

<!--
```
<custom-element-demo>
  <template>
    <template id="orbital1">
        <div class="orbital">
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital2">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital3">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital4">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital5">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital6">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital7">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital8">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital9">
        <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>
    <template id="orbital10">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital11">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital12">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital13">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital14">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital15">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>
    <template id="orbital16">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template> 
    <template id="orbital17">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>        
    <template id="orbital18">
        <div class="orbital">
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
            <div class="electron"></div>
        </div>
    </template>
    <template id="orbital19">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital20">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital21">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital22">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>
    <template id="orbital23">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>  
    <template id="orbital24">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital25">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital27">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital28">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="orbital29">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>  
    <template id="orbital30">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>  
    <template id="orbital31">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template>     
    <template id="orbital32">
            <div class="orbital">
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
                <div class="electron"></div>
            </div>
    </template> 
    <template id="Main">
        <!-- ELEMENT MIXIN TEMPLATE-->
        <!-- PLACEHOLDER MIXIN TEMPLATE-->
        
            
            <input class="category-toggle" type="radio" id="alkali-metals" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="alkaline-earth-metals" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="lanthanoids" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="actinoids" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="transition-metals" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="post-transition-metals" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="metalloids" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="other-nonmetals" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="noble-gasses" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <input class="category-toggle" type="radio" id="unknown" name="categories" />
            <input class="category-cancel" type="radio" id="cancel" name="categories" />
            <div class="periodic-table">
                    <div class="element other-nonmetal c1 r1">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1"></div>
                            <div class="atomic-number">1</div>
                            <div class="label">
                                <div class="symbol">H</div>
                                <div class="name">Hydrogen</div>
                            </div>
                            <div class="atomic-mass">1.008</div>
                            <ul class="atomic-weight">
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element noble-gas c18 r1">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2"></div>
                            <div class="atomic-number">2</div>
                            <div class="label">
                                <div class="symbol">He</div>
                                <div class="name">Helium</div>
                            </div>
                            <div class="atomic-mass">4.0026</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkali-metal c1 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model"  data-init="orbital3"></div>
                            <div class="atomic-number">3</div>
                            <div class="label">
                                <div class="symbol">Li</div>
                                <div class="name">Lithium</div>
                            </div>
                            <div class="atomic-mass">6.94</div>
                            <ul class="atomic-weight">
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkaline-earth-metal c2 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital2"></div>
                            <div class="atomic-number">4</div>
                            <div class="label">
                                <div class="symbol">Be</div>
                                <div class="name">Beryllium</div>
                            </div>
                            <div class="atomic-mass">9.0122</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c13 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital3;orbital2"></div>
                            <div class="atomic-number">5</div>
                            <div class="label">
                                <div class="symbol">B</div>
                                <div class="name">Boron</div>
                            </div>
                            <div class="atomic-mass">10.81</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c14 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital4;orbital2"></div>
                            <div class="atomic-number">6</div>
                            <div class="label">
                                <div class="symbol">C</div>
                                <div class="name">Carbon</div>
                            </div>
                            <div class="atomic-mass">12.011</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>4</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c15 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital5;orbital2"></div>
                            <div class="atomic-number">7</div>
                            <div class="label">
                                <div class="symbol">N</div>
                                <div class="name">Nitrogen</div>
                            </div>
                            <div class="atomic-mass">14.007</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>5</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c16 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital6;orbital2"></div>
                            <div class="atomic-number">8</div>
                            <div class="label">
                                <div class="symbol">O</div>
                                <div class="name">Oxygen</div>
                            </div>
                            <div class="atomic-mass">15.999</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>6</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c17 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital7;orbital2"></div>
                            <div class="atomic-number">9</div>
                            <div class="label">
                                <div class="symbol">F</div>
                                <div class="name">Flourine</div>
                            </div>
                            <div class="atomic-mass">18.998</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>7</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element noble-gas c18 r2">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital8;orbital2"></div>
                            <div class="atomic-number">10</div>
                            <div class="label">
                                <div class="symbol">Ne</div>
                                <div class="name">Neon</div>
                            </div>
                            <div class="atomic-mass">20.18</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkali-metal c1 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital8;orbital2"></div>
                            <div class="atomic-number">11</div>
                            <div class="label">
                                <div class="symbol">Na</div>
                                <div class="name">Sodium</div>
                            </div>
                            <div class="atomic-mass">22.99</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkaline-earth-metal c2 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital2"></div>
                            <div class="atomic-number">12</div>
                            <div class="label">
                                <div class="symbol">Mg</div>
                                <div class="name">Magnesium</div>
                            </div>
                            <div class="atomic-mass">24.305</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c13 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital3;orbital8;orbital2"></div>
                            <div class="atomic-number">13</div>
                            <div class="label">
                                <div class="symbol">Al</div>
                                <div class="name">Aluminium</div>
                            </div>
                            <div class="atomic-mass">26.982</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c14 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital4;orbital8;orbital2"></div>
                            <div class="atomic-number">14</div>
                            <div class="label">
                                <div class="symbol">Si</div>
                                <div class="name">Silicon</div>
                            </div>
                            <div class="atomic-mass">28.085</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>4</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c15 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital5;orbital8;orbital2"></div>
                            <div class="atomic-number">15</div>
                            <div class="label">
                                <div class="symbol">P</div>
                                <div class="name">Phosphorus</div>
                            </div>
                            <div class="atomic-mass">30.974</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>5</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c16 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital6;orbital8;orbital2"></div>
                            <div class="atomic-number">16</div>
                            <div class="label">
                                <div class="symbol">S</div>
                                <div class="name">Sulfur</div>
                            </div>
                            <div class="atomic-mass">32.06</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>6</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c17 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital7;orbital8;orbital2"></div>
                            <div class="atomic-number">17</div>
                            <div class="label">
                                <div class="symbol">Cl</div>
                                <div class="name">Chlorine</div>
                            </div>
                            <div class="atomic-mass">35.45</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>7</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element noble-gas c18 r3">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital8;orbital8;orbital2"></div>
                            <div class="atomic-number">18</div>
                            <div class="label">
                                <div class="symbol">Ar</div>
                                <div class="name">Argon</div>
                            </div>
                            <div class="atomic-mass">39.948</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>8</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkali-metal c1 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital8;orbital8;orbital2"></div>
                            <div class="atomic-number">19</div>
                            <div class="label">
                                <div class="symbol">K</div>
                                <div class="name">Potassium</div>
                            </div>
                            <div class="atomic-mass">39.098</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>8</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkaline-earth-metal c2 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital8;orbital2"></div>
                            <div class="atomic-number">20</div>
                            <div class="label">
                                <div class="symbol">Ca</div>
                                <div class="name">Calcium</div>
                            </div>
                            <div class="atomic-mass">40.078</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c3 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital8;orbital2"></div>
                            <div class="atomic-number">21</div>
                            <div class="label">
                                <div class="symbol">Sc</div>
                                <div class="name">Scandium</div>
                            </div>
                            <div class="atomic-mass">44.956</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c4 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital10;orbital8;orbital2"></div>
                            <div class="atomic-number">22</div>
                            <div class="label">
                                <div class="symbol">Ti</div>
                                <div class="name">Titanium</div>
                            </div>
                            <div class="atomic-mass">47.867</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>10</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c5 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital11;orbital8;orbital2"></div>
                            <div class="atomic-number">23</div>
                            <div class="label">
                                <div class="symbol">V</div>
                                <div class="name">Vanadium</div>
                            </div>
                            <div class="atomic-mass">50.942</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>11</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c6 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital13;orbital8;orbital2"></div>
                            <div class="atomic-number">24</div>
                            <div class="label">
                                <div class="symbol">Cr</div>
                                <div class="name">Chromium</div>
                            </div>
                            <div class="atomic-mass">51.996</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>13</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c7 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital13;orbital8;orbital2"></div>
                            <div class="atomic-number">25</div>
                            <div class="label">
                                <div class="symbol">Mn</div>
                                <div class="name">Manganese</div>
                            </div>
                            <div class="atomic-mass">54.938</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>13</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c8 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital14;orbital8;orbital2"></div>
                            <div class="atomic-number">26</div>
                            <div class="label">
                                <div class="symbol">Fe</div>
                                <div class="name">Iron</div>
                            </div>
                            <div class="atomic-mass">55.845</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>14</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c9 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital15;orbital8;orbital2"></div>
                            <div class="atomic-number">27</div>
                            <div class="label">
                                <div class="symbol">Co</div>
                                <div class="name">Cobalt</div>
                            </div>
                            <div class="atomic-mass">58.933</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>15</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c10 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital16;orbital8;orbital2"></div>
                            <div class="atomic-number">28</div>
                            <div class="label">
                                <div class="symbol">Ni</div>
                                <div class="name">Nickel</div>
                            </div>
                            <div class="atomic-mass">58.693</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>16</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c11 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">29</div>
                            <div class="label">
                                <div class="symbol">Cu</div>
                                <div class="name">Copper</div>
                            </div>
                            <div class="atomic-mass">63.546</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c12 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">30</div>
                            <div class="label">
                                <div class="symbol">Zn</div>
                                <div class="name">Zinc</div>
                            </div>
                            <div class="atomic-mass">65.38</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c13 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital18;orbital3"></div>
                            <div class="atomic-number">31</div>
                            <div class="label">
                                <div class="symbol">Ga</div>
                                <div class="name">Gallium</div>
                            </div>
                            <div class="atomic-mass">69.723</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c14 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital4;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">32</div>
                            <div class="label">
                                <div class="symbol">Ge</div>
                                <div class="name">Germanium</div>
                            </div>
                            <div class="atomic-mass">72.63</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>4</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c15 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital5;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">33</div>
                            <div class="label">
                                <div class="symbol">As</div>
                                <div class="name">Arsenic</div>
                            </div>
                            <div class="atomic-mass">74.922</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>5</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c16 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital6;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">34</div>
                            <div class="label">
                                <div class="symbol">Se</div>
                                <div class="name">Selenium</div>
                            </div>
                            <div class="atomic-mass">78.971</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>6</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c17 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital7;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">35</div>
                            <div class="label">
                                <div class="symbol">Br</div>
                                <div class="name">Bromine</div>
                            </div>
                            <div class="atomic-mass">79.904</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>7</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element noble-gas c18 r4">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital8;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">36</div>
                            <div class="label">
                                <div class="symbol">Kr</div>
                                <div class="name">Krypton</div>
                            </div>
                            <div class="atomic-mass">83.798</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>8</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkali-metal c1 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital8;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">37</div>
                            <div class="label">
                                <div class="symbol">Rb</div>
                                <div class="name">Rubidium</div>
                            </div>
                            <div class="atomic-mass">85.468</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>8</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkaline-earth-metal c2 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">38</div>
                            <div class="label">
                                <div class="symbol">Sr</div>
                                <div class="name">Strontium</div>
                            </div>
                            <div class="atomic-mass">87.62</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c3 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">39</div>
                            <div class="label">
                                <div class="symbol">Y</div>
                                <div class="name">Yttrium</div>
                            </div>
                            <div class="atomic-mass">88.906</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c4 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital10;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">40</div>
                            <div class="label">
                                <div class="symbol">Zr</div>
                                <div class="name">Zirconium</div>
                            </div>
                            <div class="atomic-mass">91.224</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>10</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c5 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital12;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">41</div>
                            <div class="label">
                                <div class="symbol">Nb</div>
                                <div class="name">Niobium</div>
                            </div>
                            <div class="atomic-mass">92.906</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>12</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c6 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital13;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">42</div>
                            <div class="label">
                                <div class="symbol">Mo</div>
                                <div class="name">Molybdenum</div>
                            </div>
                            <div class="atomic-mass">95.95</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>13</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c7 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital13;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">43</div>
                            <div class="label">
                                <div class="symbol">Tc</div>
                                <div class="name">Technetium</div>
                            </div>
                            <div class="atomic-mass">(98)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>13</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c8 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital15;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">44</div>
                            <div class="label">
                                <div class="symbol">Ru</div>
                                <div class="name">Ruthenium</div>
                            </div>
                            <div class="atomic-mass">101.07</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>15</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c9 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital16;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">45</div>
                            <div class="label">
                                <div class="symbol">Rh</div>
                                <div class="name">Rhodium</div>
                            </div>
                            <div class="atomic-mass">102.91</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>16</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c10 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">46</div>
                            <div class="label">
                                <div class="symbol">Pd</div>
                                <div class="name">Palladium</div>
                            </div>
                            <div class="atomic-mass">106.42</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c11 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">47</div>
                            <div class="label">
                                <div class="symbol">Ag</div>
                                <div class="name">Silver</div>
                            </div>
                            <div class="atomic-mass">107.87</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c12 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">48</div>
                            <div class="label">
                                <div class="symbol">Cd</div>
                                <div class="name">Cadmium</div>
                            </div>
                            <div class="atomic-mass">112.41</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c13 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital3;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">49</div>
                            <div class="label">
                                <div class="symbol">In</div>
                                <div class="name">Indium</div>
                            </div>
                            <div class="atomic-mass">114.82</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c14 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital4;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">50</div>
                            <div class="label">
                                <div class="symbol">Sn</div>
                                <div class="name">Tin</div>
                            </div>
                            <div class="atomic-mass">204.38</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>4</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c15 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital5;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">51</div>
                            <div class="label">
                                <div class="symbol">Sb</div>
                                <div class="name">Antimony</div>
                            </div>
                            <div class="atomic-mass">121.76</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>5</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c16 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital6;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">52</div>
                            <div class="label">
                                <div class="symbol">Te</div>
                                <div class="name">Tellurium</div>
                            </div>
                            <div class="atomic-mass">127.6</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>6</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element other-nonmetal c17 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital7;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">53</div>
                            <div class="label">
                                <div class="symbol">I</div>
                                <div class="name">Iodine</div>
                            </div>
                            <div class="atomic-mass">126.9</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>7</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element noble-gas c18 r5">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital8;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">54</div>
                            <div class="label">
                                <div class="symbol">Xe</div>
                                <div class="name">Xenon</div>
                            </div>
                            <div class="atomic-mass">131.29</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>8</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkali-metal c1 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital8;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">55</div>
                            <div class="label">
                                <div class="symbol">Cs</div>
                                <div class="name">Caesium</div>
                            </div>
                            <div class="atomic-mass">132.91</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>8</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkaline-earth-metal c2 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">56</div>
                            <div class="label">
                                <div class="symbol">Ba</div>
                                <div class="name">Barium</div>
                            </div>
                            <div class="atomic-mass">137.33</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c4 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital18;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">57</div>
                            <div class="label">
                                <div class="symbol">La</div>
                                <div class="name">Lanthanum</div>
                            </div>
                            <div class="atomic-mass">138.91</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>18</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c5 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital19;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">58</div>
                            <div class="label">
                                <div class="symbol">Ce</div>
                                <div class="name">Cerium</div>
                            </div>
                            <div class="atomic-mass">140.12</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>19</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c6 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital21;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">59</div>
                            <div class="label">
                                <div class="symbol">Pr</div>
                                <div class="name">Praseodymium</div>
                            </div>
                            <div class="atomic-mass">140.91</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>21</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c7 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital22;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">60</div>
                            <div class="label">
                                <div class="symbol">Nd</div>
                                <div class="name">Neodymium</div>
                            </div>
                            <div class="atomic-mass">144.24</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>22</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c8 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital23;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">61</div>
                            <div class="label">
                                <div class="symbol">Pm</div>
                                <div class="name">Promethium</div>
                            </div>
                            <div class="atomic-mass">144.24</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>23</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c9 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital24;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">62</div>
                            <div class="label">
                                <div class="symbol">Sm</div>
                                <div class="name">Samarium</div>
                            </div>
                            <div class="atomic-mass">150.36</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>24</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c10 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital25;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">63</div>
                            <div class="label">
                                <div class="symbol">Eu</div>
                                <div class="name">Europium</div>
                            </div>
                            <div class="atomic-mass">151.96</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>25</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c11 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital25;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">64</div>
                            <div class="label">
                                <div class="symbol">Gd</div>
                                <div class="name">Gadolinium</div>
                            </div>
                            <div class="atomic-mass">157.25</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>25</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c12 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital27;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">65</div>
                            <div class="label">
                                <div class="symbol">Tb</div>
                                <div class="name">Terbium</div>
                            </div>
                            <div class="atomic-mass">158.93</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>27</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c13 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital28;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">66</div>
                            <div class="label">
                                <div class="symbol">Dy</div>
                                <div class="name">Dysprosium</div>
                            </div>
                            <div class="atomic-mass">162.5</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>28</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c14 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital29;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">67</div>
                            <div class="label">
                                <div class="symbol">Ho</div>
                                <div class="name">Holmium</div>
                            </div>
                            <div class="atomic-mass">164.93</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>29</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c15 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital30;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">68</div>
                            <div class="label">
                                <div class="symbol">Er</div>
                                <div class="name">Erbium</div>
                            </div>
                            <div class="atomic-mass">167.26</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>30</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c16 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital31;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">69</div>
                            <div class="label">
                                <div class="symbol">Tm</div>
                                <div class="name">Thulium</div>
                            </div>
                            <div class="atomic-mass">168.93</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>31</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c17 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">70</div>
                            <div class="label">
                                <div class="symbol">Yb</div>
                                <div class="name">Ytterbium</div>
                            </div>
                            <div class="atomic-mass">173.05</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element lanthanoid c18 r9">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">71</div>
                            <div class="label">
                                <div class="symbol">Lu</div>
                                <div class="name">Lutetium</div>
                            </div>
                            <div class="atomic-mass">174.97</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c4 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital10;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">72</div>
                            <div class="label">
                                <div class="symbol">Hf</div>
                                <div class="name">Hafnium</div>
                            </div>
                            <div class="atomic-mass">178.49</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>10</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c5 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital11;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">73</div>
                            <div class="label">
                                <div class="symbol">Ta</div>
                                <div class="name">Tantalum</div>
                            </div>
                            <div class="atomic-mass">180.95</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>11</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c6 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital12;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">74</div>
                            <div class="label">
                                <div class="symbol">W</div>
                                <div class="name">Tungsten</div>
                            </div>
                            <div class="atomic-mass">183.84</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>12</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c7 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital13;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">75</div>
                            <div class="label">
                                <div class="symbol">Re</div>
                                <div class="name">Rhenium</div>
                            </div>
                            <div class="atomic-mass">186.21</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>13</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c8 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital14;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">76</div>
                            <div class="label">
                                <div class="symbol">Os</div>
                                <div class="name">Osmium</div>
                            </div>
                            <div class="atomic-mass">190.23</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>14</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c9 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital15;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">77</div>
                            <div class="label">
                                <div class="symbol">Ir</div>
                                <div class="name">Iridium</div>
                            </div>
                            <div class="atomic-mass">192.22</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>15</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c10 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital17;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">78</div>
                            <div class="label">
                                <div class="symbol">Pt</div>
                                <div class="name">Platinum</div>
                            </div>
                            <div class="atomic-mass">195.08</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>17</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c11 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">79</div>
                            <div class="label">
                                <div class="symbol">Au</div>
                                <div class="name">Gold</div>
                            </div>
                            <div class="atomic-mass">196.97</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c12 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">80</div>
                            <div class="label">
                                <div class="symbol">Hg</div>
                                <div class="name">Mercury</div>
                            </div>
                            <div class="atomic-mass">200.59</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c13 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital3;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">81</div>
                            <div class="label">
                                <div class="symbol">Tl</div>
                                <div class="name">Thallium</div>
                            </div>
                            <div class="atomic-mass">204.38</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c14 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital4;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">82</div>
                            <div class="label">
                                <div class="symbol">Pb</div>
                                <div class="name">Lead</div>
                            </div>
                            <div class="atomic-mass">207.2</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>4</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c15 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital5;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">83</div>
                            <div class="label">
                                <div class="symbol">Bi</div>
                                <div class="name">Bismuth</div>
                            </div>
                            <div class="atomic-mass">208.98</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>5</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c16 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital6;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">84</div>
                            <div class="label">
                                <div class="symbol">Po</div>
                                <div class="name">Polonium</div>
                            </div>
                            <div class="atomic-mass">(209)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>6</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element metalloid c17 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital7;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">85</div>
                            <div class="label">
                                <div class="symbol">At</div>
                                <div class="name">Astatine</div>
                            </div>
                            <div class="atomic-mass">(210)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>7</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element noble-gas c18 r6">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital8;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">86</div>
                            <div class="label">
                                <div class="symbol">Rn</div>
                                <div class="name">Radon</div>
                            </div>
                            <div class="atomic-mass">(222)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>8</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkali-metal c1 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital8;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">87</div>
                            <div class="label">
                                <div class="symbol">Fr</div>
                                <div class="name">Francium</div>
                            </div>
                            <div class="atomic-mass">(223)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>8</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element alkaline-earth-metal c2 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">88</div>
                            <div class="label">
                                <div class="symbol">Ra</div>
                                <div class="name">Radium</div>
                            </div>
                            <div class="atomic-mass">(226)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c4 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">89</div>
                            <div class="label">
                                <div class="symbol">Ac</div>
                                <div class="name">Actinium</div>
                            </div>
                            <div class="atomic-mass">(227)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c5 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital10;orbital18;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">90</div>
                            <div class="label">
                                <div class="symbol">Th</div>
                                <div class="name">Thorium</div>
                            </div>
                            <div class="atomic-mass">232.04</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>18</li>
                                <li>10</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c6 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital20;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">91</div>
                            <div class="label">
                                <div class="symbol">Pa</div>
                                <div class="name">Protactinium</div>
                            </div>
                            <div class="atomic-mass">231.04</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>20</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c7 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital21;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">92</div>
                            <div class="label">
                                <div class="symbol">U</div>
                                <div class="name">Uranium</div>
                            </div>
                            <div class="atomic-mass">238.03</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>21</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c8 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital22;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">93</div>
                            <div class="label">
                                <div class="symbol">Np</div>
                                <div class="name">Neptunium</div>
                            </div>
                            <div class="atomic-mass">(237)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>22</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c9 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital24;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">94</div>
                            <div class="label">
                                <div class="symbol">Pu</div>
                                <div class="name">Plutonium</div>
                            </div>
                            <div class="atomic-mass">(244)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>24</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c10 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital25;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">95</div>
                            <div class="label">
                                <div class="symbol">Am</div>
                                <div class="name">Americium</div>
                            </div>
                            <div class="atomic-mass">(243)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>25</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c11 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital9;orbital25;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">96</div>
                            <div class="label">
                                <div class="symbol">Cm</div>
                                <div class="name">Curium</div>
                            </div>
                            <div class="atomic-mass">(247)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>25</li>
                                <li>9</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c12 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital27;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">97</div>
                            <div class="label">
                                <div class="symbol">Bk</div>
                                <div class="name">Berkelium</div>
                            </div>
                            <div class="atomic-mass">(247)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>27</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c13 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital28;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">98</div>
                            <div class="label">
                                <div class="symbol">Cf</div>
                                <div class="name">Californium</div>
                            </div>
                            <div class="atomic-mass">(251)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>28</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c14 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital29;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">99</div>
                            <div class="label">
                                <div class="symbol">Es</div>
                                <div class="name">Einsteinium</div>
                            </div>
                            <div class="atomic-mass">(252)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>29</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c15 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital30;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">100</div>
                            <div class="label">
                                <div class="symbol">Fm</div>
                                <div class="name">Fermium</div>
                            </div>
                            <div class="atomic-mass">(257)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>30</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c16 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital31;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">101</div>
                            <div class="label">
                                <div class="symbol">Md</div>
                                <div class="name">Mendelevium</div>
                            </div>
                            <div class="atomic-mass">(258)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>31</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c17 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital8;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">102</div>
                            <div class="label">
                                <div class="symbol">No</div>
                                <div class="name">Nobelium</div>
                            </div>
                            <div class="atomic-mass">(259)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>8</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element actinoid c18 r10">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital3;orbital8;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">103</div>
                            <div class="label">
                                <div class="symbol">Lr</div>
                                <div class="name">Lawrencium</div>
                            </div>
                            <div class="atomic-mass">(266)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>8</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c4 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital10;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">104</div>
                            <div class="label">
                                <div class="symbol">Rf</div>
                                <div class="name">Rutherfordium</div>
                            </div>
                            <div class="atomic-mass">(267)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>10</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c5 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital11;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">105</div>
                            <div class="label">
                                <div class="symbol">Db</div>
                                <div class="name">Dubnium</div>
                            </div>
                            <div class="atomic-mass">(268)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>11</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c6 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital12;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">106</div>
                            <div class="label">
                                <div class="symbol">Sg</div>
                                <div class="name">Seaborgium</div>
                            </div>
                            <div class="atomic-mass">(269)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>12</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c7 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital13;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">107</div>
                            <div class="label">
                                <div class="symbol">Bh</div>
                                <div class="name">Bohrium</div>
                            </div>
                            <div class="atomic-mass">(270)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>13</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c8 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital14;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">108</div>
                            <div class="label">
                                <div class="symbol">Hs</div>
                                <div class="name">Hassium</div>
                            </div>
                            <div class="atomic-mass">(277)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>14</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c9 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital15;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">109</div>
                            <div class="label">
                                <div class="symbol">Mt</div>
                                <div class="name">Meitnerium</div>
                            </div>
                            <div class="atomic-mass">(278)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>15</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c10 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital1;orbital17;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">110</div>
                            <div class="label">
                                <div class="symbol">Ds</div>
                                <div class="name">Darmstadtium</div>
                            </div>
                            <div class="atomic-mass">(281)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>17</li>
                                <li>1</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c11 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital17;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">111</div>
                            <div class="label">
                                <div class="symbol">Rg</div>
                                <div class="name">Roentgenium</div>
                            </div>
                            <div class="atomic-mass">(282)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>17</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element transition-metal c12 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital2;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">112</div>
                            <div class="label">
                                <div class="symbol">Cn</div>
                                <div class="name">Copernicium</div>
                            </div>
                            <div class="atomic-mass">(282)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>2</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c13 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital3;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">113</div>
                            <div class="label">
                                <div class="symbol">Nh</div>
                                <div class="name">Nihonium</div>
                            </div>
                            <div class="atomic-mass">(286)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>3</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element post-transition-metal c14 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital4;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">114</div>
                            <div class="label">
                                <div class="symbol">Fl</div>
                                <div class="name">Flerovium</div>
                            </div>
                            <div class="atomic-mass">(289)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>4</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c15 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital5;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">115</div>
                            <div class="label">
                                <div class="symbol">Mc</div>
                                <div class="name">Moscovium</div>
                            </div>
                            <div class="atomic-mass">(290)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>5</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c16 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital6;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">116</div>
                            <div class="label">
                                <div class="symbol">Lv</div>
                                <div class="name">Livermorium</div>
                            </div>
                            <div class="atomic-mass">(293)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>6</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c17 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital7;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">117</div>
                            <div class="label">
                                <div class="symbol">Ts</div>
                                <div class="name">Tennessine</div>
                            </div>
                            <div class="atomic-mass">(294)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>7</li>
                            </ul>
                        </div>
                    </div>
                    <div class="element unknown c18 r7">
                        <input class="activate" type="radio" name="elements" />
                        <input class="deactivate" type="radio" name="elements" />
                        <div class="overlay"></div>
                        <div class="square">
                            <div class="model" data-init="orbital8;orbital18;orbital32;orbital32;orbital18;orbital8;orbital2"></div>
                            <div class="atomic-number">118</div>
                            <div class="label">
                                <div class="symbol">Og</div>
                                <div class="name">Oganesson</div>
                            </div>
                            <div class="atomic-mass">(294)</div>
                            <ul class="atomic-weight">
                                <li>2</li>
                                <li>8</li>
                                <li>18</li>
                                <li>32</li>
                                <li>32</li>
                                <li>18</li>
                                <li>8</li>
                            </ul>
                        </div>
                    </div>
                    <div class="placeholder lanthanoid c3 r6">
                        <div class="square">57-71</div>
                    </div>
                    <div class="placeholder actinoid c3 r7">
                        <div class="square">89-103</div>
                    </div>
                    <div class="gap c3 r8"></div>
                    <div class="key">
                        <div class="row">
                            <label class="alkali-metal" for="alkali-metals">Alkali Metals</label>
                            <label class="alkaline-earth-metal" for="alkaline-earth-metals">Alkaline Earth Metals</label>
                            <label class="lanthanoid" for="lanthanoids">Lanthanoids</label>
                            <label class="actinoid" for="actinoids">Aktinoids</label>
                            <label class="transition-metal" for="transition-metals">Transition Metals</label>
                            <label class="post-transition-metal" for="post-transition-metals">Post-Transition Metals</label>
                            <label class="metalloid" for="metalloids">Metalloids</label>
                            <label class="other-nonmetal" for="other-nonmetals">Other Nonmetals</label>
                            <label class="noble-gas" for="noble-gasses">Noble Gasses</label>
                            <label class="unknown" for="unknown">Unknown</label>
                        </div>
                    </div>
                </div>
            </div>
            
            
        <style>

            body {
                background: #101318;
                text-shadow: 0 0 0.4vw currentColor;
            }

            .wrapper {
                position: relative;
                overflow: hidden;
                padding: 2%;
            }

            .wrapper>input {
                -webkit-appearance: none;
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
            }

            .periodic-table {
                display: grid;
                grid-gap: 5px;
                grid-template-columns: repeat(18, 1fr);
            }

            .element {
                position: relative;
                font-size: 0.5vw;
                padding-bottom: 100%;
                cursor: pointer;
                color: #fff;
                transition: 500ms;
            }

            .element .overlay {
                position: fixed;
                z-index: 1;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                background-color: #101318;
                opacity: 0;
                pointer-events: none;
                transition: 500ms;
            }

            .element .square {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                border: 2px solid;
                box-sizing: border-box;
                background: #101318;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                transition-property: transform, z-index, left, right, top, bottom;
                transition-duration: 100ms, 0ms, 200ms, 200ms, 200ms, 200ms;
                transition-delay: 0ms, 100ms, 0ms, 0ms, 0ms, 0ms;
            }

            .element .atomic-number {
                position: absolute;
                left: 0;
                top: 0;
                padding: 2px;
            }

            .element .label {
                text-align: center;
                transition: 200ms;
            }

            .element .symbol {
                font-size: 1.7vw;
            }

            .element .name {
                font-size: 0.7vw;
            }

            .element .atomic-mass {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 2px;
                text-align: center;
            }

            .element .atomic-weight {
                position: absolute;
                right: 0;
                top: 0;
                list-style: none;
                margin: 0;
                padding: 2px;
                opacity: 0;
                transition: 200ms;
                text-align: right;
            }

            .element .model {
                display: none;
                position: absolute;
                left: -500%;
                right: -500%;
                top: -500%;
                bottom: -500%;
                transform: scale(0.1);
            }

            .element .model .orbital {
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                border: 5px solid;
                border-radius: 50%;
                opacity: 0.25;
            }

            .element .model .orbital:nth-child(1) {
                margin: 10%;
                animation-duration: 40s;
            }

            .element .model .orbital:nth-child(2) {
                margin: 15.5%;
                animation-duration: 34s;
            }

            .element .model .orbital:nth-child(3) {
                margin: 21%;
                animation-duration: 28s;
            }

            .element .model .orbital:nth-child(4) {
                margin: 26.5%;
                animation-duration: 22s;
            }

            .element .model .orbital:nth-child(5) {
                margin: 32%;
                animation-duration: 16s;
            }

            .element .model .orbital:nth-child(6) {
                margin: 37.5%;
                animation-duration: 10s;
            }

            .element .model .orbital:nth-child(7) {
                margin: 43%;
                animation-duration: 4s;
            }

            .element .model .orbital .electron {
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
            }

            .element .model .orbital .electron::before {
                content: "";
                position: absolute;
                left: calc(50% - 0.7vw);
                top: -0.7vw;
                width: 1.4vw;
                height: 1.4vw;
                background-color: currentColor;
                border-radius: 50%;
                opacity: 0.75;
            }

            .element .model .orbital .electron:nth-last-child(1):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(2):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(2):first-child~.electron:nth-child(2) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(3):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(3):first-child~.electron:nth-child(2) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(3):first-child~.electron:nth-child(3) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(4):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(4):first-child~.electron:nth-child(2) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(4):first-child~.electron:nth-child(3) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(4):first-child~.electron:nth-child(4) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(5):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(5):first-child~.electron:nth-child(2) {
                transform: rotate(72deg);
            }

            .element .model .orbital .electron:nth-last-child(5):first-child~.electron:nth-child(3) {
                transform: rotate(144deg);
            }

            .element .model .orbital .electron:nth-last-child(5):first-child~.electron:nth-child(4) {
                transform: rotate(216deg);
            }

            .element .model .orbital .electron:nth-last-child(5):first-child~.electron:nth-child(5) {
                transform: rotate(288deg);
            }

            .element .model .orbital .electron:nth-last-child(6):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(6):first-child~.electron:nth-child(2) {
                transform: rotate(60deg);
            }

            .element .model .orbital .electron:nth-last-child(6):first-child~.electron:nth-child(3) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(6):first-child~.electron:nth-child(4) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(6):first-child~.electron:nth-child(5) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(6):first-child~.electron:nth-child(6) {
                transform: rotate(300deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(2) {
                transform: rotate(51.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(3) {
                transform: rotate(102.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(4) {
                transform: rotate(154.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(5) {
                transform: rotate(205.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(6) {
                transform: rotate(257.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(7):first-child~.electron:nth-child(7) {
                transform: rotate(308.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(2) {
                transform: rotate(45deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(3) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(4) {
                transform: rotate(135deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(5) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(6) {
                transform: rotate(225deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(7) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(8):first-child~.electron:nth-child(8) {
                transform: rotate(315deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(2) {
                transform: rotate(40deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(3) {
                transform: rotate(80deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(4) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(5) {
                transform: rotate(160deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(6) {
                transform: rotate(200deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(7) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(8) {
                transform: rotate(280deg);
            }

            .element .model .orbital .electron:nth-last-child(9):first-child~.electron:nth-child(9) {
                transform: rotate(320deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(2) {
                transform: rotate(36deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(3) {
                transform: rotate(72deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(4) {
                transform: rotate(108deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(5) {
                transform: rotate(144deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(6) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(7) {
                transform: rotate(216deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(8) {
                transform: rotate(252deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(9) {
                transform: rotate(288deg);
            }

            .element .model .orbital .electron:nth-last-child(10):first-child~.electron:nth-child(10) {
                transform: rotate(324deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(2) {
                transform: rotate(32.7272727273deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(3) {
                transform: rotate(65.4545454545deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(4) {
                transform: rotate(98.1818181818deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(5) {
                transform: rotate(130.9090909091deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(6) {
                transform: rotate(163.6363636364deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(7) {
                transform: rotate(196.3636363636deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(8) {
                transform: rotate(229.0909090909deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(9) {
                transform: rotate(261.8181818182deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(10) {
                transform: rotate(294.5454545455deg);
            }

            .element .model .orbital .electron:nth-last-child(11):first-child~.electron:nth-child(11) {
                transform: rotate(327.2727272727deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(2) {
                transform: rotate(30deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(3) {
                transform: rotate(60deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(4) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(5) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(6) {
                transform: rotate(150deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(7) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(8) {
                transform: rotate(210deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(9) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(10) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(11) {
                transform: rotate(300deg);
            }

            .element .model .orbital .electron:nth-last-child(12):first-child~.electron:nth-child(12) {
                transform: rotate(330deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(2) {
                transform: rotate(27.6923076923deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(3) {
                transform: rotate(55.3846153846deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(4) {
                transform: rotate(83.0769230769deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(5) {
                transform: rotate(110.7692307692deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(6) {
                transform: rotate(138.4615384615deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(7) {
                transform: rotate(166.1538461538deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(8) {
                transform: rotate(193.8461538462deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(9) {
                transform: rotate(221.5384615385deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(10) {
                transform: rotate(249.2307692308deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(11) {
                transform: rotate(276.9230769231deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(12) {
                transform: rotate(304.6153846154deg);
            }

            .element .model .orbital .electron:nth-last-child(13):first-child~.electron:nth-child(13) {
                transform: rotate(332.3076923077deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(2) {
                transform: rotate(25.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(3) {
                transform: rotate(51.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(4) {
                transform: rotate(77.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(5) {
                transform: rotate(102.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(6) {
                transform: rotate(128.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(7) {
                transform: rotate(154.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(8) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(9) {
                transform: rotate(205.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(10) {
                transform: rotate(231.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(11) {
                transform: rotate(257.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(12) {
                transform: rotate(282.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(13) {
                transform: rotate(308.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(14):first-child~.electron:nth-child(14) {
                transform: rotate(334.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(2) {
                transform: rotate(24deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(3) {
                transform: rotate(48deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(4) {
                transform: rotate(72deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(5) {
                transform: rotate(96deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(6) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(7) {
                transform: rotate(144deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(8) {
                transform: rotate(168deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(9) {
                transform: rotate(192deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(10) {
                transform: rotate(216deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(11) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(12) {
                transform: rotate(264deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(13) {
                transform: rotate(288deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(14) {
                transform: rotate(312deg);
            }

            .element .model .orbital .electron:nth-last-child(15):first-child~.electron:nth-child(15) {
                transform: rotate(336deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(2) {
                transform: rotate(22.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(3) {
                transform: rotate(45deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(4) {
                transform: rotate(67.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(5) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(6) {
                transform: rotate(112.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(7) {
                transform: rotate(135deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(8) {
                transform: rotate(157.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(9) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(10) {
                transform: rotate(202.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(11) {
                transform: rotate(225deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(12) {
                transform: rotate(247.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(13) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(14) {
                transform: rotate(292.5deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(15) {
                transform: rotate(315deg);
            }

            .element .model .orbital .electron:nth-last-child(16):first-child~.electron:nth-child(16) {
                transform: rotate(337.5deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(2) {
                transform: rotate(21.1764705882deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(3) {
                transform: rotate(42.3529411765deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(4) {
                transform: rotate(63.5294117647deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(5) {
                transform: rotate(84.7058823529deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(6) {
                transform: rotate(105.8823529412deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(7) {
                transform: rotate(127.0588235294deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(8) {
                transform: rotate(148.2352941176deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(9) {
                transform: rotate(169.4117647059deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(10) {
                transform: rotate(190.5882352941deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(11) {
                transform: rotate(211.7647058824deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(12) {
                transform: rotate(232.9411764706deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(13) {
                transform: rotate(254.1176470588deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(14) {
                transform: rotate(275.2941176471deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(15) {
                transform: rotate(296.4705882353deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(16) {
                transform: rotate(317.6470588235deg);
            }

            .element .model .orbital .electron:nth-last-child(17):first-child~.electron:nth-child(17) {
                transform: rotate(338.8235294118deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(2) {
                transform: rotate(20deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(3) {
                transform: rotate(40deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(4) {
                transform: rotate(60deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(5) {
                transform: rotate(80deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(6) {
                transform: rotate(100deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(7) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(8) {
                transform: rotate(140deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(9) {
                transform: rotate(160deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(10) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(11) {
                transform: rotate(200deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(12) {
                transform: rotate(220deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(13) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(14) {
                transform: rotate(260deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(15) {
                transform: rotate(280deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(16) {
                transform: rotate(300deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(17) {
                transform: rotate(320deg);
            }

            .element .model .orbital .electron:nth-last-child(18):first-child~.electron:nth-child(18) {
                transform: rotate(340deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(2) {
                transform: rotate(18.9473684211deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(3) {
                transform: rotate(37.8947368421deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(4) {
                transform: rotate(56.8421052632deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(5) {
                transform: rotate(75.7894736842deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(6) {
                transform: rotate(94.7368421053deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(7) {
                transform: rotate(113.6842105263deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(8) {
                transform: rotate(132.6315789474deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(9) {
                transform: rotate(151.5789473684deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(10) {
                transform: rotate(170.5263157895deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(11) {
                transform: rotate(189.4736842105deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(12) {
                transform: rotate(208.4210526316deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(13) {
                transform: rotate(227.3684210526deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(14) {
                transform: rotate(246.3157894737deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(15) {
                transform: rotate(265.2631578947deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(16) {
                transform: rotate(284.2105263158deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(17) {
                transform: rotate(303.1578947368deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(18) {
                transform: rotate(322.1052631579deg);
            }

            .element .model .orbital .electron:nth-last-child(19):first-child~.electron:nth-child(19) {
                transform: rotate(341.0526315789deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(2) {
                transform: rotate(18deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(3) {
                transform: rotate(36deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(4) {
                transform: rotate(54deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(5) {
                transform: rotate(72deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(6) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(7) {
                transform: rotate(108deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(8) {
                transform: rotate(126deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(9) {
                transform: rotate(144deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(10) {
                transform: rotate(162deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(11) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(12) {
                transform: rotate(198deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(13) {
                transform: rotate(216deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(14) {
                transform: rotate(234deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(15) {
                transform: rotate(252deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(16) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(17) {
                transform: rotate(288deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(18) {
                transform: rotate(306deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(19) {
                transform: rotate(324deg);
            }

            .element .model .orbital .electron:nth-last-child(20):first-child~.electron:nth-child(20) {
                transform: rotate(342deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(2) {
                transform: rotate(17.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(3) {
                transform: rotate(34.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(4) {
                transform: rotate(51.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(5) {
                transform: rotate(68.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(6) {
                transform: rotate(85.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(7) {
                transform: rotate(102.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(8) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(9) {
                transform: rotate(137.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(10) {
                transform: rotate(154.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(11) {
                transform: rotate(171.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(12) {
                transform: rotate(188.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(13) {
                transform: rotate(205.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(14) {
                transform: rotate(222.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(15) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(16) {
                transform: rotate(257.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(17) {
                transform: rotate(274.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(18) {
                transform: rotate(291.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(19) {
                transform: rotate(308.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(20) {
                transform: rotate(325.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(21):first-child~.electron:nth-child(21) {
                transform: rotate(342.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(2) {
                transform: rotate(16.3636363636deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(3) {
                transform: rotate(32.7272727273deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(4) {
                transform: rotate(49.0909090909deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(5) {
                transform: rotate(65.4545454545deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(6) {
                transform: rotate(81.8181818182deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(7) {
                transform: rotate(98.1818181818deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(8) {
                transform: rotate(114.5454545455deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(9) {
                transform: rotate(130.9090909091deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(10) {
                transform: rotate(147.2727272727deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(11) {
                transform: rotate(163.6363636364deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(12) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(13) {
                transform: rotate(196.3636363636deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(14) {
                transform: rotate(212.7272727273deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(15) {
                transform: rotate(229.0909090909deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(16) {
                transform: rotate(245.4545454545deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(17) {
                transform: rotate(261.8181818182deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(18) {
                transform: rotate(278.1818181818deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(19) {
                transform: rotate(294.5454545455deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(20) {
                transform: rotate(310.9090909091deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(21) {
                transform: rotate(327.2727272727deg);
            }

            .element .model .orbital .electron:nth-last-child(22):first-child~.electron:nth-child(22) {
                transform: rotate(343.6363636364deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(2) {
                transform: rotate(15.652173913deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(3) {
                transform: rotate(31.3043478261deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(4) {
                transform: rotate(46.9565217391deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(5) {
                transform: rotate(62.6086956522deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(6) {
                transform: rotate(78.2608695652deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(7) {
                transform: rotate(93.9130434783deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(8) {
                transform: rotate(109.5652173913deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(9) {
                transform: rotate(125.2173913043deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(10) {
                transform: rotate(140.8695652174deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(11) {
                transform: rotate(156.5217391304deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(12) {
                transform: rotate(172.1739130435deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(13) {
                transform: rotate(187.8260869565deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(14) {
                transform: rotate(203.4782608696deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(15) {
                transform: rotate(219.1304347826deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(16) {
                transform: rotate(234.7826086957deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(17) {
                transform: rotate(250.4347826087deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(18) {
                transform: rotate(266.0869565217deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(19) {
                transform: rotate(281.7391304348deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(20) {
                transform: rotate(297.3913043478deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(21) {
                transform: rotate(313.0434782609deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(22) {
                transform: rotate(328.6956521739deg);
            }

            .element .model .orbital .electron:nth-last-child(23):first-child~.electron:nth-child(23) {
                transform: rotate(344.347826087deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(2) {
                transform: rotate(15deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(3) {
                transform: rotate(30deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(4) {
                transform: rotate(45deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(5) {
                transform: rotate(60deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(6) {
                transform: rotate(75deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(7) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(8) {
                transform: rotate(105deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(9) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(10) {
                transform: rotate(135deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(11) {
                transform: rotate(150deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(12) {
                transform: rotate(165deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(13) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(14) {
                transform: rotate(195deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(15) {
                transform: rotate(210deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(16) {
                transform: rotate(225deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(17) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(18) {
                transform: rotate(255deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(19) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(20) {
                transform: rotate(285deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(21) {
                transform: rotate(300deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(22) {
                transform: rotate(315deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(23) {
                transform: rotate(330deg);
            }

            .element .model .orbital .electron:nth-last-child(24):first-child~.electron:nth-child(24) {
                transform: rotate(345deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(2) {
                transform: rotate(14.4deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(3) {
                transform: rotate(28.8deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(4) {
                transform: rotate(43.2deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(5) {
                transform: rotate(57.6deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(6) {
                transform: rotate(72deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(7) {
                transform: rotate(86.4deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(8) {
                transform: rotate(100.8deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(9) {
                transform: rotate(115.2deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(10) {
                transform: rotate(129.6deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(11) {
                transform: rotate(144deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(12) {
                transform: rotate(158.4deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(13) {
                transform: rotate(172.8deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(14) {
                transform: rotate(187.2deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(15) {
                transform: rotate(201.6deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(16) {
                transform: rotate(216deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(17) {
                transform: rotate(230.4deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(18) {
                transform: rotate(244.8deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(19) {
                transform: rotate(259.2deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(20) {
                transform: rotate(273.6deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(21) {
                transform: rotate(288deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(22) {
                transform: rotate(302.4deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(23) {
                transform: rotate(316.8deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(24) {
                transform: rotate(331.2deg);
            }

            .element .model .orbital .electron:nth-last-child(25):first-child~.electron:nth-child(25) {
                transform: rotate(345.6deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(2) {
                transform: rotate(13.8461538462deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(3) {
                transform: rotate(27.6923076923deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(4) {
                transform: rotate(41.5384615385deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(5) {
                transform: rotate(55.3846153846deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(6) {
                transform: rotate(69.2307692308deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(7) {
                transform: rotate(83.0769230769deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(8) {
                transform: rotate(96.9230769231deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(9) {
                transform: rotate(110.7692307692deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(10) {
                transform: rotate(124.6153846154deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(11) {
                transform: rotate(138.4615384615deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(12) {
                transform: rotate(152.3076923077deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(13) {
                transform: rotate(166.1538461538deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(14) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(15) {
                transform: rotate(193.8461538462deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(16) {
                transform: rotate(207.6923076923deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(17) {
                transform: rotate(221.5384615385deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(18) {
                transform: rotate(235.3846153846deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(19) {
                transform: rotate(249.2307692308deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(20) {
                transform: rotate(263.0769230769deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(21) {
                transform: rotate(276.9230769231deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(22) {
                transform: rotate(290.7692307692deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(23) {
                transform: rotate(304.6153846154deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(24) {
                transform: rotate(318.4615384615deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(25) {
                transform: rotate(332.3076923077deg);
            }

            .element .model .orbital .electron:nth-last-child(26):first-child~.electron:nth-child(26) {
                transform: rotate(346.1538461538deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(2) {
                transform: rotate(13.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(3) {
                transform: rotate(26.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(4) {
                transform: rotate(40deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(5) {
                transform: rotate(53.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(6) {
                transform: rotate(66.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(7) {
                transform: rotate(80deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(8) {
                transform: rotate(93.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(9) {
                transform: rotate(106.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(10) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(11) {
                transform: rotate(133.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(12) {
                transform: rotate(146.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(13) {
                transform: rotate(160deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(14) {
                transform: rotate(173.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(15) {
                transform: rotate(186.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(16) {
                transform: rotate(200deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(17) {
                transform: rotate(213.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(18) {
                transform: rotate(226.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(19) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(20) {
                transform: rotate(253.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(21) {
                transform: rotate(266.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(22) {
                transform: rotate(280deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(23) {
                transform: rotate(293.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(24) {
                transform: rotate(306.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(25) {
                transform: rotate(320deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(26) {
                transform: rotate(333.3333333333deg);
            }

            .element .model .orbital .electron:nth-last-child(27):first-child~.electron:nth-child(27) {
                transform: rotate(346.6666666667deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(2) {
                transform: rotate(12.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(3) {
                transform: rotate(25.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(4) {
                transform: rotate(38.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(5) {
                transform: rotate(51.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(6) {
                transform: rotate(64.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(7) {
                transform: rotate(77.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(8) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(9) {
                transform: rotate(102.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(10) {
                transform: rotate(115.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(11) {
                transform: rotate(128.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(12) {
                transform: rotate(141.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(13) {
                transform: rotate(154.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(14) {
                transform: rotate(167.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(15) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(16) {
                transform: rotate(192.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(17) {
                transform: rotate(205.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(18) {
                transform: rotate(218.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(19) {
                transform: rotate(231.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(20) {
                transform: rotate(244.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(21) {
                transform: rotate(257.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(22) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(23) {
                transform: rotate(282.8571428571deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(24) {
                transform: rotate(295.7142857143deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(25) {
                transform: rotate(308.5714285714deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(26) {
                transform: rotate(321.4285714286deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(27) {
                transform: rotate(334.2857142857deg);
            }

            .element .model .orbital .electron:nth-last-child(28):first-child~.electron:nth-child(28) {
                transform: rotate(347.1428571429deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(2) {
                transform: rotate(12.4137931034deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(3) {
                transform: rotate(24.8275862069deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(4) {
                transform: rotate(37.2413793103deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(5) {
                transform: rotate(49.6551724138deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(6) {
                transform: rotate(62.0689655172deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(7) {
                transform: rotate(74.4827586207deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(8) {
                transform: rotate(86.8965517241deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(9) {
                transform: rotate(99.3103448276deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(10) {
                transform: rotate(111.724137931deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(11) {
                transform: rotate(124.1379310345deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(12) {
                transform: rotate(136.5517241379deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(13) {
                transform: rotate(148.9655172414deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(14) {
                transform: rotate(161.3793103448deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(15) {
                transform: rotate(173.7931034483deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(16) {
                transform: rotate(186.2068965517deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(17) {
                transform: rotate(198.6206896552deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(18) {
                transform: rotate(211.0344827586deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(19) {
                transform: rotate(223.4482758621deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(20) {
                transform: rotate(235.8620689655deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(21) {
                transform: rotate(248.275862069deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(22) {
                transform: rotate(260.6896551724deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(23) {
                transform: rotate(273.1034482759deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(24) {
                transform: rotate(285.5172413793deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(25) {
                transform: rotate(297.9310344828deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(26) {
                transform: rotate(310.3448275862deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(27) {
                transform: rotate(322.7586206897deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(28) {
                transform: rotate(335.1724137931deg);
            }

            .element .model .orbital .electron:nth-last-child(29):first-child~.electron:nth-child(29) {
                transform: rotate(347.5862068966deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(2) {
                transform: rotate(12deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(3) {
                transform: rotate(24deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(4) {
                transform: rotate(36deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(5) {
                transform: rotate(48deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(6) {
                transform: rotate(60deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(7) {
                transform: rotate(72deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(8) {
                transform: rotate(84deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(9) {
                transform: rotate(96deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(10) {
                transform: rotate(108deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(11) {
                transform: rotate(120deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(12) {
                transform: rotate(132deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(13) {
                transform: rotate(144deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(14) {
                transform: rotate(156deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(15) {
                transform: rotate(168deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(16) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(17) {
                transform: rotate(192deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(18) {
                transform: rotate(204deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(19) {
                transform: rotate(216deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(20) {
                transform: rotate(228deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(21) {
                transform: rotate(240deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(22) {
                transform: rotate(252deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(23) {
                transform: rotate(264deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(24) {
                transform: rotate(276deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(25) {
                transform: rotate(288deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(26) {
                transform: rotate(300deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(27) {
                transform: rotate(312deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(28) {
                transform: rotate(324deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(29) {
                transform: rotate(336deg);
            }

            .element .model .orbital .electron:nth-last-child(30):first-child~.electron:nth-child(30) {
                transform: rotate(348deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(2) {
                transform: rotate(11.6129032258deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(3) {
                transform: rotate(23.2258064516deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(4) {
                transform: rotate(34.8387096774deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(5) {
                transform: rotate(46.4516129032deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(6) {
                transform: rotate(58.064516129deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(7) {
                transform: rotate(69.6774193548deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(8) {
                transform: rotate(81.2903225806deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(9) {
                transform: rotate(92.9032258065deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(10) {
                transform: rotate(104.5161290323deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(11) {
                transform: rotate(116.1290322581deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(12) {
                transform: rotate(127.7419354839deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(13) {
                transform: rotate(139.3548387097deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(14) {
                transform: rotate(150.9677419355deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(15) {
                transform: rotate(162.5806451613deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(16) {
                transform: rotate(174.1935483871deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(17) {
                transform: rotate(185.8064516129deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(18) {
                transform: rotate(197.4193548387deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(19) {
                transform: rotate(209.0322580645deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(20) {
                transform: rotate(220.6451612903deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(21) {
                transform: rotate(232.2580645161deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(22) {
                transform: rotate(243.8709677419deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(23) {
                transform: rotate(255.4838709677deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(24) {
                transform: rotate(267.0967741935deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(25) {
                transform: rotate(278.7096774194deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(26) {
                transform: rotate(290.3225806452deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(27) {
                transform: rotate(301.935483871deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(28) {
                transform: rotate(313.5483870968deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(29) {
                transform: rotate(325.1612903226deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(30) {
                transform: rotate(336.7741935484deg);
            }

            .element .model .orbital .electron:nth-last-child(31):first-child~.electron:nth-child(31) {
                transform: rotate(348.3870967742deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(1) {
                transform: rotate(0deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(2) {
                transform: rotate(11.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(3) {
                transform: rotate(22.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(4) {
                transform: rotate(33.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(5) {
                transform: rotate(45deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(6) {
                transform: rotate(56.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(7) {
                transform: rotate(67.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(8) {
                transform: rotate(78.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(9) {
                transform: rotate(90deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(10) {
                transform: rotate(101.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(11) {
                transform: rotate(112.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(12) {
                transform: rotate(123.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(13) {
                transform: rotate(135deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(14) {
                transform: rotate(146.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(15) {
                transform: rotate(157.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(16) {
                transform: rotate(168.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(17) {
                transform: rotate(180deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(18) {
                transform: rotate(191.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(19) {
                transform: rotate(202.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(20) {
                transform: rotate(213.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(21) {
                transform: rotate(225deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(22) {
                transform: rotate(236.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(23) {
                transform: rotate(247.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(24) {
                transform: rotate(258.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(25) {
                transform: rotate(270deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(26) {
                transform: rotate(281.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(27) {
                transform: rotate(292.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(28) {
                transform: rotate(303.75deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(29) {
                transform: rotate(315deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(30) {
                transform: rotate(326.25deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(31) {
                transform: rotate(337.5deg);
            }

            .element .model .orbital .electron:nth-last-child(32):first-child~.electron:nth-child(32) {
                transform: rotate(348.75deg);
            }

            .element input[type="radio"] {
                -webkit-appearance: none;
                position: absolute;
                z-index: 2;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                cursor: pointer;
                outline: none;
            }

            .element input[type="radio"].activate:hover~.square {
                z-index: 2;
                transform: scale(1.35);
                transition-delay: 0ms;
                outline: none;
                pointer-events: none;
            }

            .element input[type="radio"].activate:checked+input[type="radio"].deactivate {
                z-index: 3;
                pointer-events: all;
            }

            .element input[type="radio"].activate:checked~.overlay {
                opacity: 0.75;
            }

            .element input[type="radio"].activate:checked~.square {
                z-index: 3;
                transform: scale(3);
                transition-duration: 500ms, 0ms, 200ms, 200ms, 200ms, 200ms;
                transition-delay: 0ms;
                outline: none;
                cursor: auto;
            }

            .element input[type="radio"].activate:checked~.square .label {
                transition-duration: 500ms;
                transform: scale(0.75);
            }

            .element input[type="radio"].activate:checked~.square .atomic-weight {
                opacity: 1;
                transition: 500ms;
            }

            .element input[type="radio"].activate:checked~.square .model {
                display: block;
                animation: fade-in;
                animation-duration: 1s;
            }

            .element input[type="radio"].activate:checked~.square .orbital {
                animation-name: rotate;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }

            .element input[type="radio"].deactivate {
                position: fixed;
                display: block;
                z-index: 1;
                opacity: 0;
                pointer-events: none;
            }

            .element input[type="radio"].deactivate:checked~.square {
                z-index: 1;
            }

            .placeholder {
                position: relative;
                z-index: -1;
                font-size: 1vw;
                padding-bottom: 100%;
                color: #fff;
                transition: 500ms;
            }

            .placeholder .square {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                border: 2px solid;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                opacity: 0.5;
            }

            .gap {
                position: relative;
                padding-bottom: 100%;
                transition: 500ms;
            }

            .gap::before {
                content: "";
                position: absolute;
                left: 50%;
                top: 0;
                width: 50%;
                height: calc(200% + 5px * 2 - 4px);
                border-width: 0 0 2px 2px;
                border-style: solid;
                margin-left: -1px;
                color: #fff;
                opacity: 0.2;
            }

            .alkali-metal {
                color: #ecbe59;
            }

            .alkaline-earth-metal {
                color: #dee955;
            }

            .lanthanoid {
                color: #ec77a3;
            }

            .actinoid {
                color: #c686cc;
            }

            .transition-metal {
                color: #fd8572;
            }

            .post-transition-metal {
                color: #4cddf3;
            }

            .metalloid {
                color: #3aefb6;
            }

            .other-nonmetal {
                color: #52ee61;
            }

            .noble-gas {
                color: #759fff;
            }

            .unknown {
                color: #cccccc;
            }

            .r1 {
                grid-row: 1;
            }

            .r2 {
                grid-row: 2;
            }

            .r3 {
                grid-row: 3;
            }

            .r4 {
                grid-row: 4;
            }

            .r5 {
                grid-row: 5;
            }

            .r6 {
                grid-row: 6;
            }

            .r7 {
                grid-row: 7;
            }

            .r8 {
                grid-row: 8;
            }

            .r9 {
                grid-row: 9;
            }

            .r10 {
                grid-row: 10;
            }

            .c1 {
                grid-column: 1;
            }

            .c2 {
                grid-column: 2;
            }

            .c3 {
                grid-column: 3;
            }

            .c4 {
                grid-column: 4;
            }

            .c5 {
                grid-column: 5;
            }

            .c6 {
                grid-column: 6;
            }

            .c7 {
                grid-column: 7;
            }

            .c8 {
                grid-column: 8;
            }

            .c9 {
                grid-column: 9;
            }

            .c10 {
                grid-column: 10;
            }

            .c11 {
                grid-column: 11;
            }

            .c12 {
                grid-column: 12;
            }

            .c13 {
                grid-column: 13;
            }

            .c14 {
                grid-column: 14;
            }

            .c15 {
                grid-column: 15;
            }

            .c16 {
                grid-column: 16;
            }

            .c17 {
                grid-column: 17;
            }

            .c18 {
                grid-column: 18;
            }

            .r1 input[type="radio"].activate:checked~.square {
                top: 100%;
            }

            .r10 input[type="radio"].activate:checked~.square {
                top: -100%;
            }

            .c1 input[type="radio"].activate:checked~.square {
                left: 100%;
            }

            .c18 input[type="radio"].activate:checked~.square {
                left: -100%;
            }

            @keyframes rotate {
                from {
                    transform: rotate(0deg);
                }

                to {
                    transform: rotate(360deg);
                }
            }

            @keyframes fade-in {
                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @keyframes noise {

                0%,
                100% {
                    background-position: 0 0;
                }

                10% {
                    background-position: -5% -10%;
                }

                20% {
                    background-position: -15% 5%;
                }

                30% {
                    background-position: 7% -25%;
                }

                40% {
                    background-position: 20% 25%;
                }

                50% {
                    background-position: -25% 10%;
                }

                60% {
                    background-position: 15% 5%;
                }

                70% {
                    background-position: 0% 15%;
                }

                80% {
                    background-position: 25% 35%;
                }

                90% {
                    background-position: -10% 10%;
                }
            }

            .key {
                position: relative;
                z-index: 1;
                grid-row: 1;
                grid-column-start: 3;
                grid-column-end: 17;
                font-size: 0.8vw;
                line-height: 1.5;
                display: flex;
                align-items: center;
                pointer-events: none;
                user-select: none;
            }

            .key .row {
                position: relative;
                display: flex;
                width: 100%;
                justify-content: space-between;
            }

            .key .row label {
                opacity: 0.85;
                cursor: pointer;
                transition: 120ms;
                pointer-events: all;
            }

            .key .row label:hover {
                opacity: 1 !important;
            }

            #alkali-metals:checked~.periodic-table .element:not(.alkali-metal),
            #alkaline-earth-metals:checked~.periodic-table .element:not(.alkaline-earth-metal),
            #lanthanoids:checked~.periodic-table .element:not(.lanthanoid),
            #actinoids:checked~.periodic-table .element:not(.actinoid),
            #transition-metals:checked~.periodic-table .element:not(.transition-metal),
            #post-transition-metals:checked~.periodic-table .element:not(.post-transition-metal),
            #metalloids:checked~.periodic-table .element:not(.metalloid),
            #other-nonmetals:checked~.periodic-table .element:not(.other-nonmetal),
            #noble-gasses:checked~.periodic-table .element:not(.noble-gas),
            #unknown:checked~.periodic-table .element:not(.unknown),
            #alkali-metals:checked~.periodic-table .placeholder,
            #alkaline-earth-metals:checked~.periodic-table .placeholder,
            #lanthanoids:checked~.periodic-table .placeholder:not(.lanthanoid),
            #actinoids:checked~.periodic-table .placeholder:not(.actinoid),
            #transition-metals:checked~.periodic-table .placeholder,
            #post-transition-metals:checked~.periodic-table .placeholder,
            #metalloids:checked~.periodic-table .placeholder,
            #other-nonmetals:checked~.periodic-table .placeholder,
            #noble-gasses:checked~.periodic-table .placeholder,
            #unknown:checked~.periodic-table .placeholder {
                opacity: 0.15;
                pointer-events: none;
            }

            #alkali-metals:checked~.periodic-table .key label:not(.alkali-metal),
            #alkaline-earth-metals:checked~.periodic-table .key label:not(.alkaline-earth-metal),
            #lanthanoids:checked~.periodic-table .key label:not(.lanthanoid),
            #actinoids:checked~.periodic-table .key label:not(.actinoid),
            #transition-metals:checked~.periodic-table .key label:not(.transition-metal),
            #post-transition-metals:checked~.periodic-table .key label:not(.post-transition-metal),
            #metalloids:checked~.periodic-table .key label:not(.metalloid),
            #other-nonmetals:checked~.periodic-table .key label:not(.other-nonmetal),
            #noble-gasses:checked~.periodic-table .key label:not(.noble-gas),
            #unknown:checked~.periodic-table .key label:not(.unknown) {
                opacity: 0.65;
            }

            .category-toggle:not(#lanthanoids):not(#actinoids):checked~.periodic-table .gap {
                opacity: 0.5;
            }

            .category-toggle:checked~.category-cancel {
                visibility: visible;
                pointer-events: all;
                cursor: pointer;
            }
        </style>
    </template>
    <div id="target" class="wrapper"></div>
    <script type="module">
        import { init } from 'https://cdn.jsdelivr.net/npm/trans-render@0.0.26/init.js';
        init(Main, {
            transform: {
                '*': x  => ({
                    matchNextSib: true,
                    matchFirstChild: true
                }),
                '[data-init]': ({target, ctx}) =>{
                    const split = target.dataset.init.split(';');
                    split.forEach(section =>{
                        init(self[section], {}, target);
                    })
                    
                }
            }
        }, target);
    </script>
  </template>
</custom-element-demo>
```
-->