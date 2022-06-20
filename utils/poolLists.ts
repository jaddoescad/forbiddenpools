import { collection, query, getDocs } from 'firebase/firestore';
import { KnownNetwork, StaticPoolInfo } from '@tracer-protocol/pools-js';
import { networkConfig } from '~/constants/networks';
import { db } from '~/utils/firebase';

/**
 * Fetch all pool list json and return mapped to URI
 */
export const getAllPoolLists = async (network: KnownNetwork): Promise<any> => {
    const tracerList: StaticPoolInfo[] = [];
    const poolsRef = collection(db, networkConfig[network]?.name);
    const q = query(poolsRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        tracerList.push({ address: doc.data().address });
    });

    return {
        All: tracerList ? tracerList : [],
    };
};
