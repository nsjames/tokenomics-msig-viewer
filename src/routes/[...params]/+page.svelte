<script lang="ts">
    import {getActions} from "$lib";
    import {NETWORKS} from "$lib/networks";

    export let data;

    $: actions = data.actions;

    let account:string = "eosnationftw";
    let proposal:string = "main.test";
    let network:string = NETWORKS.mainnet;

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

    const isSetCode = (action:any) => {
        return action.account === 'eosio' && action.name === 'setcode';
    }

    const isSetAbi = (action:any) => {
        return action.account === 'eosio' && action.name === 'setabi';
    }

    const downloadWasm = (action:any) => {
        const blob = new Blob([action.data._rawCodeOrAbi], {type: 'application/wasm'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action.data.account}.wasm`;
        a.click();
    }

    const downloadAbi = (action:any) => {
        const blob = new Blob([JSON.stringify(action.data._rawCodeOrAbi, null, 4)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action.data.account}.abi`;
        a.click();
    }
</script>




<section class="p-2 bg-zinc-950 min-h-screen">

    <section class="text-center mt-5 py-7 text-white max-w-2xl mx-auto">
        <h1 class="text-3xl">EOS Tokenomics MSIG Viewer</h1>
        <p class="text-xs mt-1 max-w-md mx-auto">
            There is a problem with all MSIG viewers where they will not decode actions of a newly deployed contract within
            the same transaction. This tool will allow you to view the EOS tokenomics proposals that include changes
            to the system contracts and usage of those new contracts within the same transaction.
        </p>
    </section>

    <section class="flex flex-row gap-2 border border-zinc-600 rounded-lg p-1 w-fit mx-auto">
        <input type="text" bind:value={account} placeholder="account" class="border border-zinc-200 rounded p-2">
        <input type="text" bind:value={proposal} placeholder="proposal" class="border border-zinc-200 rounded p-2">
        <select bind:value={network} class="border border-zinc-200 rounded p-2 capitalize">
            {#each Object.keys(NETWORKS) as network}
                <option class="capitalize" value={NETWORKS[network]}>{network}</option>
            {/each}
        </select>

        <button class="bg-zinc-500 hover:bg-zinc-400 text-white p-2 px-4 font-bold rounded" on:click={findProposal}>Load MSIG</button>
    </section>

    <section class="flex flex-col gap-2 mx-auto max-w-3xl pt-10">
        {#if actions}
            {#each actions as action,index}
                <section class="bg-white text-black rounded-lg p-4">
                    <section class="flex items-center gap-2">
                        <figure class="p-1 px-2 bg-zinc-600 text-white rounded text-xs mt-1">
                            #{index+1}
                        </figure>
                        <figure class="text-xl"><span class="font-bold">{action.account} :: <u>{action.name}</u></span></figure>
                    </section>

                    <section class="bg-gray-50 border border-zinc-200 rounded-lg p-4 mt-2 text-xs">
                        {#if !Object.keys(action.data).length}
                            <figure class="opacity-30">No parameters for this action</figure>
                        {:else}
                            {#each Object.keys(action.data) as key}
                                {#if key !== '_rawCodeOrAbi'}
                                    <figure>
                                        {key}: <span class="font-bold whitespace-pre">{readableValue(action.data[key])}</span>
                                    </figure>
                                {/if}
                            {/each}
                        {/if}
                    </section>

                    {#if isSetCode(action)}
                        <button on:click={() => downloadWasm(action)} class="bg-blue-600 hover:bg-blue-500 text-white text-xs p-1.5 px-3 font-bold rounded mt-2">
                            Download WASM
                        </button>
                    {/if}

                    {#if isSetAbi(action)}
                        <button on:click={() => downloadAbi(action)} class="bg-blue-600 hover:bg-blue-500 text-white text-xs p-1.5 px-3 font-bold rounded mt-2">
                            Download ABI
                        </button>
                    {/if}
                </section>
            {/each}
        {:else}
            <section class="bg-white rounded-lg text-black text-center p-4 py-8">
                <figure>No proposal found</figure>
            </section>
        {/if}

    </section>
</section>
