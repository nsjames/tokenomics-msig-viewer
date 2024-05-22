// place files you want to import through the `$lib` alias in this folder.
import {ABI, APIClient, Name, PackedTransaction, Checksum256} from "@wharfkit/antelope";

export const getActions = async (fetch:any, account:string, proposal: string, network:string) => {
    const grabAbi = (filename:string) => {
        return fetch(`/abis/${filename}`).then((x:any) => {
            return x.json();
        });
    }

    const client = new APIClient({
        // url: "https://eos.greymass.com",
        url: network,
        fetch
    });

    return await client.v1.chain.get_table_rows({
        code: "eosio.msig",
        scope: account,
        table: "proposal",
        json: true,
        lower_bound: Name.from(proposal),
    }).then(async (response) => {
        if(!response.rows[0]){
            return null;
        }

        const unpacked = PackedTransaction.from({
            packed_trx: response.rows[0].packed_transaction
        }).getTransaction();


        let actions:any[] = [];
        for(let action of unpacked.actions) {

            const abi = await (async () => {
                switch(action.account.toString()){
                    case 'eosio.token': return grabAbi('eosio.token.abi');
                    case 'eosio': return grabAbi('eosio.system.abi');
                    case 'eosio.fees': return grabAbi('eosio.fees.abi');
                    default: return client.v1.chain.get_abi(action.account).then((response) => {
                        return response.abi;
                    });
                }
            })();

            if(!abi){
                actions.push({
                    account: action.account,
                    name: action.name,
                    authorization: action.authorization,
                    data: {
                        error: "INVALID ABI"
                    }
                })
                continue;
            }

            const decoded:any = action.decodeData(ABI.from(abi));

            if(action.account.toString() === 'eosio'){
                if(action.name.toString() === 'setcode'){
                    decoded.code = Checksum256.hash(decoded.code.array);
                }

                if(action.name.toString() === 'setabi'){
                    decoded.abi = Checksum256.hash(decoded.abi.array);
                }
            }

            actions.push({
                account: action.account,
                name: action.name,
                authorization: action.authorization,
                data: decoded
            })
        }

        return JSON.parse(JSON.stringify(actions));
    }).catch(err => {
        console.error(err);
        return null;
    })
}
