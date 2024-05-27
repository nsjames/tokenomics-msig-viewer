<script lang="ts">
    import {getActions} from "$lib";
    import {NETWORKS} from "$lib/networks";
    import {onMount} from "svelte";

    export let data;

    let actions:any = null;


    let account:string = data.account || "";
    let proposal:string = data.proposal || "";
    let network:string = data.network || NETWORKS.mainnet;
    let loading:boolean = false;

    const updateUrl = () => {
        if(!account || !proposal){
            window.history.pushState({}, '', '/');
        } else {
            const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key] === network);
            const url = `/${networkKey}/${account}/${proposal}`;
            window.history.pushState({}, '', url);
        }
    }

    const findProposal = async () => {
        loading = true;
        updateUrl();
        const res = await getActions(fetch, account, proposal, network).catch(err => {
            alert(err);
            return null;
        })

        loading = false;

        if(!res) {
            return data.actions = null;
        }

        if(!res) return;
        actions = res;
    }

    const readableValue = (value:any) => {
        if(typeof value === 'object') {
            return JSON.stringify(value, null, 4);
        }

        return value;
    }

    const downloadFile = (action:any, suffix:string) => {
        const type = suffix === 'wasm' ? 'application/wasm' : 'application/json';
        const blob = suffix === 'wasm'
            ? new Blob([action.data._rawCodeOrAbi], {type})
            : new Blob([JSON.stringify(action.data._rawCodeOrAbi)], {type});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action.data.account}.${suffix}`;
        a.click();
    }

    onMount(() => {
        if(account && proposal) {
            findProposal();
        }
    })
</script>


<section class="p-2 bg-zinc-950 min-h-screen">

    <section class="text-center mt-5 py-7 text-white max-w-2xl mx-auto">
        <h1 class="text-3xl">EOS Tokenomics MSIG Viewer</h1>
        <p class="text-xs mt-1 max-w-md mx-auto">
            Unlike other MSIG viewers, this viewer will properly decode actions of newly deployed contracts within the same transaction cumulatively.
        </p>
    </section>

    <section class="flex gap-2 border border-zinc-600 rounded-lg p-1 mx-auto flex-col w-full lg:flex-row lg:w-fit">
        <input type="text" bind:value={account} placeholder="account" class="border border-zinc-200 rounded p-2">
        <input type="text" bind:value={proposal} placeholder="proposal" class="border border-zinc-200 rounded p-2">
        <select bind:value={network} class="border border-zinc-200 rounded p-2 capitalize">
            {#each Object.keys(NETWORKS) as network}
                <option class="capitalize" value={NETWORKS[network]}>{network}</option>
            {/each}
        </select>

        {#if loading}
            <button class="bg-zinc-800 cursor-not-allowed text-white p-2 px-4 font-bold rounded">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
            </button>
        {:else}
            <button class="bg-zinc-500 hover:bg-zinc-400 text-white p-2 px-4 font-bold rounded" on:click={findProposal}>Load MSIG</button>
        {/if}
    </section>

    <section class="flex flex-col gap-2 mx-auto max-w-3xl pt-10">
        {#if loading}
            <div class="skeleton w-full h-[100px] mb-4 rounded"></div>
        {:else}
            {#if actions}
                {#each actions as action,index}
                    <section class="bg-white text-black rounded-lg p-4">
                        <section class="flex items-center gap-2">
                            <figure class="p-1 px-2 bg-zinc-600 text-white rounded text-xs mt-1">
                                #{index+1}
                            </figure>
                            <figure class="text-xl"><span class="font-bold">{action.account} :: <u>{action.name}</u></span></figure>
                        </section>

                        <section class="bg-gray-50 border border-zinc-200 rounded-lg p-4 mt-2 text-xs overflow-x-scroll">
                            {#if !Object.keys(action.data).length}
                                <figure class="opacity-30">No parameters for this action</figure>
                            {:else}
                                {#each Object.keys(action.data) as key}
                                    {#if key !== '_rawCodeOrAbi'}
                                        <figure>
                                            {key}: <span class="font-bold whitespace-pre break-words">{readableValue(action.data[key])}</span>
                                        </figure>
                                    {/if}
                                {/each}
                            {/if}
                        </section>

                        {#if action.account === 'eosio' && action.name === 'setcode'}
                            <button on:click={() => downloadFile(action, 'wasm')} class="bg-blue-600 hover:bg-blue-500 text-white text-xs p-1.5 px-3 font-bold rounded mt-2">
                                Download WASM
                            </button>
                        {/if}

                        {#if action.account === 'eosio' && action.name === 'setabi'}
                            <button on:click={() => downloadFile(action, 'abi')} class="bg-blue-600 hover:bg-blue-500 text-white text-xs p-1.5 px-3 font-bold rounded mt-2">
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
        {/if}

    </section>
</section>

<style>
    @keyframes shine {
        0% {
            background-position: -200px 0;
        }
        100% {
            background-position: 200px 0;
        }
    }

    .skeleton {
        background: linear-gradient(40deg, #1f1f1f 25%, #313131 50%, #212121 75%);
        background-size: 400px 100%;
        animation: shine 2s infinite;
    }
</style>
