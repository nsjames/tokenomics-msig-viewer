import {ABI, APIClient, Name, PackedTransaction, Checksum256, Serializer, Bytes, Blob, Transaction} from "@wharfkit/antelope";

export const getActions = async (fetch:any, account:string, proposal: string, network:string) => {
    const grabAbi = (filename:string) => {
        return fetch(`/abis/${filename}`).then((x:any) => {
            return x.json();
        });
    }

    const client = new APIClient({
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

        let newlySetAbis:{[key:string]:any} = {};

        let actions:any[] = [];

        const parseActions = async (_actions:any[]) => {
            for(let action of _actions) {
                if(action.account.toString() === 'eosio'){
                    if(action.name.toString() === 'setabi'){
                        const currentSystemAbi = await grabAbi('eosio.system.abi');
                        const decoded:any = action.decodeData(ABI.from(currentSystemAbi));
                        newlySetAbis[decoded.account.toString()] = Serializer.decode({data: decoded.abi, type: ABI});
                    }
                }

                const abi = await (async() => {
                    if(newlySetAbis[action.account.toString()]){
                        return newlySetAbis[action.account.toString()];
                    }

                    return client.v1.chain.get_abi(action.account).then(x => x.abi).catch(err => {
                        console.error(err);
                        return null;
                    });
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

                if(action.account.toString() === 'eosio.msig' && action.name.toString() === 'propose'){
                    console.log(decoded.trx.actions);
                    const trx = Transaction.from(decoded.trx);
                    actions.push({
                        account: 'wrapped actions start',
                        name: 'see below',
                        authorization: action.authorization,
                        data: {
                            info: "The actions below are wrapped in the MSIG proposal. This action will not be included in the MSIG.",
                        },
                        wrapper:true,
                    })
                    await parseActions(trx.actions);
                    actions.push({
                        account: 'wrapped actions end',
                        name: 'see above',
                        authorization: action.authorization,
                        data: {
                            info: "The actions above are decoded from the trx in the proposal below. This action will not be included in the MSIG.",
                        },
                        wrapper:true,
                    })
                }

                if(action.account.toString() === 'eosio'){
                    if(action.name.toString() === 'setcode'){
                        decoded._rawCodeOrAbi = decoded.code;
                        decoded.code = Checksum256.hash(decoded.code.array);
                    }

                    if(action.name.toString() === 'setabi'){
                        const decodedAbi = Serializer.decode({data: decoded.abi, type: ABI})
                        const jsonabi = ABI.from(decodedAbi);
                        decoded._rawCodeOrAbi = jsonabi;
                        decoded.abi = Checksum256.hash(Bytes.fromString(JSON.stringify(jsonabi),'utf8').array);
                    }
                }

                actions.push({
                    account: action.account,
                    name: action.name,
                    authorization: action.authorization,
                    data: decoded,
                })
            }
        }

        await parseActions(unpacked.actions);

        return JSON.parse(JSON.stringify(actions));
    }).catch(err => {
        console.error(err);
        return null;
    })
}
