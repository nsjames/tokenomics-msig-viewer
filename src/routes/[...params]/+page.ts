import {getActions} from "$lib";
import {NETWORKS} from "$lib/networks";

export const load = async ({ fetch, url }) => {
    let [network, account, proposal] = url.pathname.split('/').filter(x => !!x);

    network = NETWORKS[network.toLowerCase()];
    if(!network) network = NETWORKS.mainnet;

    if(!account) account = "eosnationftw";
    if(!proposal) proposal = "main.test";

    const actions = await getActions(fetch, account, proposal, network);
    return {
        actions
    };

};
