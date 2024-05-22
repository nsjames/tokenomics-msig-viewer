import {getActions} from "$lib";

export const load = async ({ fetch }) => {

    const actions = await getActions(fetch, "eosnationftw", "main.test", "https://eos.greymass.com");
    return {
        actions
    };

};
