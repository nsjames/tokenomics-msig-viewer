<script lang="ts">
    import {getActions} from "$lib";
    import {NETWORKS} from "$lib/networks";
    import {onMount} from "svelte";
    import {Bytes, Checksum256} from "@wharfkit/antelope";
    import WharfService, {account} from "$lib/wharf";

    export let data;

    let actions:any = null;

    let proposalData:any = null;
    let approveHash:string = "";


    let proposer:string = data.account || "";
    let proposal:string = data.proposal || "";
    let network:string = data.network || NETWORKS.mainnet;
    let loading:boolean = false;

    const updateUrl = () => {
        if(!proposer || !proposal){
            window.history.pushState({}, '', '/');
        } else {
            const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key] === network);
            const url = `/${networkKey}/${proposer}/${proposal}`;
            window.history.pushState({}, '', url);
        }
    }

    const findProposal = async () => {
        loading = true;
        updateUrl();
        const res = await getActions(fetch, proposer, proposal, network).catch(err => {
            alert(err);
            return null;
        })

        loading = false;

        proposalData = res;
        console.log('proposalData', proposalData);
    }

    const readableValue = (value:any) => {
        if(typeof value === 'object') {
            return JSON.stringify(value, null, 4);
        }

        return value;
    }

    const downloadFile = (action:any, suffix:string) => {
        const blob = suffix === 'wasm'
            ? new Blob([Bytes.from(action.data._rawCodeOrAbi).array], {type: 'application/wasm'})
            : new Blob([JSON.stringify(action.data._rawCodeOrAbi)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${action.data.account}.${suffix}`;
        a.click();
    }

    onMount(() => {
        if(proposer && proposal) {
            findProposal();
        }

        WharfService.init();
    })

    $: isProposer = $account && proposer === $account;
    $: isApprover = $account && proposalData?.approvals.find((x:any) => x.name.split('@')[0] === $account);
    $: hasApproved = $account && proposalData?.approvals.find((x:any) => x.name.split('@')[0] === $account && x.approved);

    const refresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await findProposal();
    }

    const approve = async () => {
        if(await WharfService.approve(proposer, proposal, approveHash.trim().length ? approveHash : undefined)){
            await refresh();
        }
    }

    const unapprove = async () => {
        if(await WharfService.unapprove(proposer, proposal)){
            await refresh();
        }
    }

    const cancel = async () => {
        if(await WharfService.cancel(proposer, proposal)){
            await refresh();
        }
    }

    const exec = async () => {
        if(await WharfService.exec(proposer, proposal)){
            await refresh();
        }
    }
</script>


<section class="p-2 bg-zinc-950 min-h-screen relative">

    <section style="z-index: -1;">

        <figure class="bg-[#120ef0] opacity-30 w-[1200px] aspect-[4/3] rounded-full blur-[200px] fixed -top-[70%] -left-[40%]"></figure>
        <figure class="bg-[#fc0303] opacity-30 w-[800px] aspect-[4/3] rounded-full blur-[200px] fixed -bottom-[20%] -right-[10%]"></figure>
    </section>

    <section class="z-10 relative">
        <section class="text-center mt-5 py-7 text-white max-w-2xl mx-auto">
            <h1 class="text-5xl font-bold">EOS MSIG Viewer</h1>
            <p class="text-xs mt-1 max-w-md mx-auto">
                Unlike other MSIG viewers, this viewer will properly decode actions of newly deployed contracts within the same transaction cumulatively.
            </p>
        </section>

        <section class="flex gap-2 border border-zinc-600 rounded-lg p-1 mx-auto flex-col w-full lg:flex-row lg:w-fit">
            <input type="text" bind:value={proposer} placeholder="account" class="border border-zinc-200 rounded p-2" on:keydown={(e) => e.key === 'Enter' && findProposal()} />
            <input type="text" bind:value={proposal} placeholder="proposal" class="border border-zinc-200 rounded p-2" on:keydown={(e) => e.key === 'Enter' && findProposal()} />
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
                <button class="btn" on:click={findProposal}>Load MSIG</button>
            {/if}
        </section>

        <section class="flex flex-col gap-2 mx-auto max-w-3xl pt-10">
            {#if loading}
                <div class="skeleton w-full h-[100px] mb-4 rounded"></div>
            {:else}
                {#if proposalData}

                    <figure class="text-sm font-bold text-white">
                        Hash
                    </figure>
                    <figure class="text-white font-bold text-xl -mt-2 break-all">
                        {proposalData.hash}
                    </figure>

                    <figure class="text-sm font-bold text-white">
                        Expiration
                    </figure>
                    <figure class="text-white font-bold text-xl -mt-2">
                        {new Date(proposalData.expiration).toLocaleString()}
                    </figure>

                    {#if proposalData.earliestExecution}
                        <figure class="text-sm font-bold text-white">
                            Earliest Execution
                        </figure>
                        <figure class="text-white font-bold text-xl -mt-2">
                            {new Date(proposalData.earliestExecution).toLocaleString()}
                        </figure>
                    {/if}

                    <figure class="text-sm font-bold text-white mt-5">
                        Approvals ({proposalData.approvals.filter(x => x.approved).length}/{proposalData.approvals.length})
                    </figure>
                    <section class="flex flex-wrap gap-0.5">
                        {#each proposalData.approvals as requested}
                            <figure class="rounded bg-blue-500 text-white font-bold px-3 py-2 text-xs {requested.approved ? '' : 'opacity-50'} hover:opacity-100">
                                {requested.name}
                            </figure>
                        {/each}
                    </section>


                    <figure class="text-sm font-bold text-white mt-5">
                        Actions
                    </figure>
                    {#each proposalData.actions as action,index}
                        <section class="text-black rounded-lg p-4 {action.wrapper ? 'bg-blue-200' : 'bg-white'}">
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

                    <figure class="text-sm font-bold text-white mt-10">
                        What would you like to do?
                    </figure>

                    <section class="fles flex-wrap">
                        {#if $account}
                            {#if isApprover}
                                {#if hasApproved}
                                    <button class="btn" on:click={unapprove}>
                                        Unapprove
                                    </button>
                                {:else}
                                    <input bind:value={approveHash} type="text" placeholder="Hash (optional)" class="border border-zinc-200 rounded p-2" />
                                    <button class="btn" on:click={approve}>
                                        Approve
                                    </button>
                                {/if}
                            {/if}

                            {#if isProposer}
                                <button class="btn" on:click={cancel}>
                                    Cancel
                                </button>
                            {/if}

                            <button class="btn" on:click={exec}>
                                Execute
                            </button>
                        {/if}

                        {#if !$account}
                            <button class="btn-primary" on:click={WharfService.login}>
                                Login
                            </button>
                        {:else}
                            <button class="btn" on:click={WharfService.logout}>
                                Logout ({$account})
                            </button>
                        {/if}
                    </section>

                    <div style="height: 100px"></div>

                {:else}
                    <section class="bg-white rounded-lg text-black text-center p-4 py-8">
                        <figure>No proposal found</figure>
                    </section>
                {/if}
            {/if}

        </section>
    </section>
</section>

<style>
    .btn {
        @apply border border-zinc-500 text-white hover:bg-white hover:text-black p-2 px-4 font-bold rounded;
    }
    .btn-primary {
        @apply bg-blue-500 text-white hover:bg-white hover:text-black p-2 px-4 font-bold rounded;
    }
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
