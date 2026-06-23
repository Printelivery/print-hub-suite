/**********************************************************************
 * Printelivery Image Manager
 * Version 2
 **********************************************************************/

const ImageManager = (() => {

    const IMAGE_FOLDER = "../images/";
    const MAX_IMAGES = 20;

    const cache = {};

    //------------------------------------------------------------
    // Check whether an image exists
    //------------------------------------------------------------

    function imageExists(src){

        return new Promise(resolve=>{

            const img=new Image();

            img.onload=()=>resolve(true);

            img.onerror=()=>resolve(false);

            img.src=src+"?v="+Date.now();

        });

    }

    //------------------------------------------------------------
    // Scan product images
    //------------------------------------------------------------

    async function loadImages(productId){

        if(cache[productId])
            return cache[productId];

        let images=[];

        //--------------------------------------------------------
        // Base Image
        //--------------------------------------------------------

        const baseImage=IMAGE_FOLDER+productId+".jpg";

        if(await imageExists(baseImage))
            images.push(baseImage);

        //--------------------------------------------------------
        // Gallery Images
        //--------------------------------------------------------

        for(let i=1;i<=MAX_IMAGES;i++){

            const file=IMAGE_FOLDER+i+"_"+productId+".jpg";

            if(await imageExists(file))
                images.push(file);

        }

        //--------------------------------------------------------
        // If no base image but gallery exists
        //--------------------------------------------------------

        if(images.length===0){

            cache[productId]=[];

            return [];

        }

        //--------------------------------------------------------
        // If base image missing
        //--------------------------------------------------------

        if(
            !images[0].endsWith(productId+".jpg") &&
            images.length>0
        ){
            // already starts with 1_
        }

        cache[productId]=images;

        return images;

    }

    //------------------------------------------------------------
    // Get Images
    //------------------------------------------------------------

    async function getImages(productId){

        if(cache[productId])
            return cache[productId];

        return await loadImages(productId);

    }

    //------------------------------------------------------------
    // First image
    //------------------------------------------------------------

    async function getThumbnail(productId){

        const imgs=await getImages(productId);

        if(imgs.length)
            return imgs[0];

        return "https://placehold.co/600x400/075E54/ffffff?text="+productId;

    }

    //------------------------------------------------------------
    // Preload
    //------------------------------------------------------------

    async function preload(productId){

        const imgs=await getImages(productId);

        imgs.forEach(src=>{

            const img=new Image();

            img.src=src;

        });

    }

    //------------------------------------------------------------
    // Clear cache
    //------------------------------------------------------------

    function clearCache(){

        Object.keys(cache).forEach(key=>delete cache[key]);

    }

    //------------------------------------------------------------
    // Public
    //------------------------------------------------------------

    return{

        getImages,

        getThumbnail,

        preload,

        clearCache

    };

})();
