export function waitForAttributeChange(el, attributeName, test) {
    //kind of limited, promises only seem to support one time only events.  I guess this is what RxJS is trying to do
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === attributeName) {
                    if (test) {
                        if (test(el.getAttribute(attributeName))) {
                            observer.disconnect();
                            resolve();
                        }
                    }
                    else {
                        observer.disconnect();
                        resolve();
                    }
                }
            });
        });
        const observerConfig = {
            attributes: true,
        };
        observer.observe(el, observerConfig);
    });
}
