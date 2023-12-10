let cacheData="appV1";
this.addEventListener("install" ,(event)=>{
    event.waitUntil(
        caches.open(cacheData).then((cache)=>{
            cache.addAll([
                  '/static/js/bundle.js',
                  '/index.html',
                  '/',
                  '/form1',
                  '/getdata',
                  '/manifest.json',
                  'favicon.ico'
                //   '/users',
            ]);
        })
    );
});

// this.addEventListener("fetch",(event)=>{
//     event.respondWith(
//         caches.match(event.request).then((resp)=>{
//             if(resp){
//                 return resp
//             }
//         })
//     )
// })

this.addEventListener("fetch", (event) => {
    if(!navigator.onLine)
    {

        event.respondWith(
                    caches.match(event.request).then((resp)=>{
                        if(resp){
                            return resp
                        }
                        let requestUrl = event.request.clone();
                        return fetch(requestUrl)

    })
    // event.respondWith(
    //     caches.match(event.request).then((resp) => {
    //         return resp || fetch(event.request).then((response) => {
    //             return caches.open(cacheData).then((cache) => {
    //                 cache.put(event.request, response.clone());
    //                 return response;
    //             });
    //         });
    //     }).catch(() => {
    //         console.error('Fetch error:', error);
    //         // Handle errors, e.g., return a custom offline page
    //     })
    )
}
});
