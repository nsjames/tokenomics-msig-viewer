import {Session, SessionKit, Chains} from "@wharfkit/session"
import {writable, type Writable} from "svelte/store";
import {TransactPluginResourceProvider} from "@wharfkit/transact-plugin-resource-provider";
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor"
import { toast } from 'svelte-sonner'

export let account:Writable<string|null> = writable(null);

export default class WharfService {
    public static sessionKit:SessionKit|null = null;
    public static session:Session|null = null;

    static async init(){
        const { WebRenderer } = await import("@wharfkit/web-renderer");
        const { WalletPluginScatter } = await import("@wharfkit/wallet-plugin-scatter");
        const { WalletPluginWombat } = await import("@wharfkit/wallet-plugin-wombat");
        const { WalletPluginTokenPocket } = await import("@wharfkit/wallet-plugin-tokenpocket");
        WharfService.sessionKit = new SessionKit({
            appName: "msigviewer",
            chains: [
                Chains.EOS,
                Chains.Jungle4,
                Chains.KylinTestnet,
            ],
            ui: new WebRenderer(),
            walletPlugins: [
                new WalletPluginAnchor(),
                new WalletPluginScatter(),
                new WalletPluginWombat(),
                new WalletPluginTokenPocket(),
            ],
        },
        {
            transactPlugins: [new TransactPluginResourceProvider()],
        })

        const session = await WharfService.sessionKit.restore()
        if(session) {
            WharfService.session = session
            account.set(session.actor.toString())
        }
    }

    static async login(){
        if(!WharfService.sessionKit) await WharfService.init();
        WharfService.session = (x => x ? x.session : null)(await WharfService.sessionKit?.login().catch(err => {
            console.error('login error', err)
            return null;
        }))

        account.set(
            WharfService.session
                ? WharfService.session.actor.toString()
                : null
        )
    }

    static async logout(){
        await WharfService.sessionKit?.logout()
        account.set(null)
    }

    static async approve(proposer:string, proposal_name:string, proposal_hash:string|undefined = undefined){
        if (!WharfService.session) return;

        const data:any = {
            proposer,
            proposal_name,
            level: WharfService.session?.permissionLevel,
        };

        if(proposal_hash) {
            data.proposal_hash = proposal_hash;
        }

        return WharfService.session?.transact({
            actions: [
                {
                    account: "eosio.msig",
                    name: "approve",
                    authorization: [WharfService.session?.permissionLevel],
                    data
                }
            ]
        } as any).catch(err => {
            console.error(err)
            toast.error('There was a problem approving the proposal. Check the console for more information about what happened.')
            return null;
        });
    }

    static async cancel(proposer:string, proposal_name:string){
        if (!WharfService.session) return;

        return WharfService.session?.transact({
            actions: [
                {
                    account: "eosio.msig",
                    name: "cancel",
                    authorization: [WharfService.session?.permissionLevel],
                    data: {
                        proposer,
                        proposal_name,
                        canceler: WharfService.session?.actor,
                    }
                }
            ]
        } as any).catch(err => {
            console.error(err)
            toast.error('There was a problem cancelling the proposal. Check the console for more information about what happened.')
            return null;
        });
    }

    static async exec(proposer:string, proposal_name:string){
        if (!WharfService.session) return;

        return WharfService.session?.transact({
            actions: [
                {
                    account: "eosio.msig",
                    name: "exec",
                    authorization: [WharfService.session?.permissionLevel],
                    data: {
                        proposer,
                        proposal_name,
                        executer: WharfService.session?.actor,
                    }
                }
            ]
        } as any).catch(err => {
            console.error(err)
            toast.error('There was a problem executing the proposal. Check the console for more information about what happened.')
            return null;
        });
    }

    static async unapprove(proposer:string, proposal_name:string){
        if (!WharfService.session) return;

        return WharfService.session?.transact({
            actions: [
                {
                    account: "eosio.msig",
                    name: "unapprove",
                    authorization: [WharfService.session?.permissionLevel],
                    data: {
                        proposer,
                        proposal_name,
                        level: WharfService.session?.permissionLevel,
                    }
                }
            ]
        } as any).catch(err => {
            console.error(err)
            toast.error('There was a problem approving the proposal. Check the console for more information about what happened.')
            return null;
        });
    }
}
