<script lang="ts">
    import {getActions} from "$lib";

    export let data;

    const NETWORKS:any = {
        'Kylin': 'https://kylin.api.eosnation.io',
        'Mainnet': 'https://eos.greymass.com',
        'Jungle': 'https://jungle4.greymass.io',
    }

    $: actions = data.actions;

    let account:string = "eosnationftw";
    let proposal:string = "main.test";
    let network:string = NETWORKS.Mainnet;

    const findProposal = async () => {
        const res = await getActions(fetch, account, proposal, network).catch(err => {
            alert(err);
            return null;
        })

        if(!res) {
            return data.actions = null;
        }

        if(!res) return;
        data.actions = res;
    }

    const readableValue = (value:any) => {
        if(typeof value === 'object') {
            return JSON.stringify(value, null, 4);
        }

        return value;
    }
</script>




<section class="p-2 bg-zinc-950 min-h-screen">

    <section class="text-center mt-5 py-7 text-white max-w-2xl mx-auto">
        <h1 class="text-3xl">EOS Tokenomics MSIG Viewer</h1>
        <p class="text-xs mt-1 max-w-md mx-auto">
            There is a problem with most MSIG viewers where they will not decode actions of a newly deployed contract within
            the same transaction. This tool will allow you to view those types of proposals.
        </p>
    </section>

    <section class="flex flex-row gap-2 border border-zinc-600 rounded-lg p-1 w-fit mx-auto">
        <input type="text" bind:value={account} placeholder="account" class="border border-zinc-200 rounded p-2">
        <input type="text" bind:value={proposal} placeholder="proposal" class="border border-zinc-200 rounded p-2">
        <select bind:value={network} class="border border-zinc-200 rounded p-2">
            {#each Object.keys(NETWORKS) as network}
                <option value={NETWORKS[network]}>{network}</option>
            {/each}
        </select>

        <button class="bg-zinc-500 hover:bg-zinc-400 text-white p-2 px-4 font-bold rounded" on:click={findProposal}>Load MSIG</button>
    </section>

    <section class="flex flex-col gap-2 mx-auto max-w-3xl pt-10">
        {#if actions}
            {#each actions as action,index}
                <section class="bg-white text-black rounded-lg p-4">
                    <section class="flex items-center gap-2">
                        <figure class="p-1 px-2 bg-zinc-800 text-white rounded-lg text-xs mt-1">
                            #{index+1}
                        </figure>
                        <figure class="text-xl"><span class="font-bold">{action.account} :: <u>{action.name}</u></span></figure>
                    </section>

                    <section class="bg-gray-50 border border-zinc-200 rounded-lg p-4 mt-2 text-xs">
                        {#if !Object.keys(action.data).length}
                            <figure class="opacity-30">No parameters for this action</figure>
                        {:else}
                            {#each Object.keys(action.data) as key}
                                <figure>
                                    {key}: <span class="font-bold whitespace-pre">{readableValue(action.data[key])}</span>
                                </figure>
                            {/each}
                        {/if}
                    </section>
                </section>
            {/each}
        {:else}
            <section class="bg-white rounded-lg text-black text-center p-4 py-8">
                <figure>No proposal found</figure>
            </section>
        {/if}

    </section>
</section>
