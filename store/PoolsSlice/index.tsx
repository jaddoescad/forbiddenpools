import { doc, setDoc } from 'firebase/firestore';
import { StaticPoolInfo } from '@tracer-protocol/pools-js';
import { networkConfig } from '~/constants/networks';
import { StateSlice } from '~/store/types';
import { db } from '~/utils/firebase';
import { getAllPoolLists } from '~/utils/poolLists';
import { IPoolsSlice } from './types';
import { StoreState } from '..';

export const createPoolsSlice: StateSlice<IPoolsSlice> = (set, get) => ({
    poolLists: {},
    setPoolLists: (network, lists) => {
        set((state) => void (state.poolLists[network] = lists));
    },
    importPool: (network, pool) => {
        if (get().poolLists[network]) {
            setDoc(doc(db, networkConfig[network]?.name, pool), {
                address: pool,
            });
            set((state) => void state.poolLists[network]?.All.push({ address: pool }));
        }
    },
    fetchPoolLists: async (network) => {
        // if list not already set for this network
        if (!get().poolLists[network]) {
            const poolLists = await getAllPoolLists(network).catch((err) => console.error(err));
            if (!poolLists) {
                console.error('Failed to initialise pools: poolsList undefined');
                return;
            }
            set((state) => void (state.poolLists[network] = poolLists));
        }
    },
});

export const selectImportedPools: (state: StoreState) => StaticPoolInfo[] = (state) =>
    state.web3Slice.network ? state.poolsSlice.poolLists[state.web3Slice.network]?.All ?? [] : [];
export const selectFetchPools: (state: StoreState) => IPoolsSlice['fetchPoolLists'] = (state) =>
    state.poolsSlice.fetchPoolLists;
export const selectImportPool: (state: StoreState) => IPoolsSlice['importPool'] = (state) =>
    state.poolsSlice.importPool;
