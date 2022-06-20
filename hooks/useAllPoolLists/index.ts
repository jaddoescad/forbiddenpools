import { useCallback, useEffect, useReducer, useRef } from 'react';
import { StaticPoolInfo } from '@tracer-protocol/pools-js';
import { useStore } from '~/store/main';
import { StoreState } from '~/store/types';
import { selectNetwork } from '~/store/Web3Slice';

// wrapper hook to memoize fetching of poolLists
export const useAllPoolLists = (): StaticPoolInfo[] => {
    // can be used to trigger a state udpate
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const ref = useRef<StaticPoolInfo[]>([]);
    const network = useStore(selectNetwork);
    const poolLists = useStore(
        useCallback((state: StoreState) => network && state.poolsSlice.poolLists[network], [network]),
    );

    useEffect(() => {
        if (!!poolLists) {
            console.log('Flattening pools list', poolLists);
            ref.current = poolLists.All;
            forceUpdate();
        }
    }, [poolLists]);

    return ref.current;
};
