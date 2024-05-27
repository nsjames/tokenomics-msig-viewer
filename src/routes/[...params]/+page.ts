import {getActions} from "$lib";
import {NETWORKS} from "$lib/networks";

export const load = async ({ fetch, url }) => {
    let [network, account, proposal] = url.pathname.split('/').filter(x => !!x);
    network = network ? NETWORKS[network.toLowerCase()] : null;
    if(!network) network = NETWORKS.mainnet;
    return {
        network, account, proposal
    };
};
