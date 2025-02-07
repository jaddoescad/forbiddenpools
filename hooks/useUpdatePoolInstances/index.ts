import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import shallow from 'zustand/shallow';
import { Pool } from '@tracer-protocol/pools-js';
import { useStore } from '~/store/main';
import { selectUserCommitActions } from '~/store/PendingCommitSlice';
import {
    selectPoolInstanceActions,
    selectPoolInstances,
    selectPoolInstanceUpdateActions,
    selectPoolsInitialized,
} from '~/store/PoolInstancesSlice';
import { KnownPoolsInitialisationErrors } from '~/store/PoolInstancesSlice/types';
import { selectWeb3Info } from '~/store/Web3Slice';

import { V2_SUPPORTED_NETWORKS } from '~/types/networks';
import { isSupportedNetwork } from '~/utils/supportedNetworks';
import { fetchPendingCommits } from '~/utils/tracerAPI';
import { useAllPoolLists } from '../useAllPoolLists';

/**
 * Wrapper to update all pools information
 */
export const useUpdatePoolInstances = (): void => {
    const { setMultiplePools, resetPools, setPoolsInitialized, setTokenBalances, setPoolsInitializationError } =
        useStore(selectPoolInstanceActions, shallow);
    const {
        updateTokenApprovals,
        updatePoolTokenBalances,
        updateSettlementTokenBalances,
        updateTradeStats,
        updatePoolCommitStats,
        updatePoolBalancerPrices,
        updateNextPoolStates,
    } = useStore(selectPoolInstanceUpdateActions, shallow);
    const { addMutlipleCommits } = useStore(selectUserCommitActions, shallow);
    const { provider, account, network } = useStore(selectWeb3Info, shallow);
    const poolLists = useAllPoolLists();
    const pools = useStore(selectPoolInstances);
    const poolsInitialized = useStore(selectPoolsInitialized);

    // ref to assist in the ensuring that the pools are not getting set twice
    const hasSetPools = useRef(false);
    const [isFetchingPools, setIsFetchingPools] = useState(false);

    // if the pools from the factory change, re-init them
    useEffect(() => {
        let mounted = true;
        console.log('Attempting to initialise pools', pools);
        // this is not the greatest for the time being
        if (!!poolLists.length && provider && network && !isFetchingPools) {
            if (isSupportedNetwork(network)) {
                const fetchAndSetPools = async () => {
                    setIsFetchingPools(true);
                    console.debug(`Initialising pools ${network.slice()}`, poolLists);
                    resetPools();
                    hasSetPools.current = false;
                    setPoolsInitialized(false);
                    setPoolsInitializationError(undefined);
                    Promise.all(
                        poolLists.map((pool) =>
                            Pool.Create({
                                ...pool,
                                address: pool.address,
                                provider,
                            }),
                        ),
                    )
                        .then((pools_) => {
                            if (!hasSetPools.current && mounted) {
                                if (pools_.length) {
                                    // if pools exist
                                    setMultiplePools(pools_, network);
                                    setPoolsInitialized(true);
                                    hasSetPools.current = true;
                                } else {
                                    setPoolsInitializationError(KnownPoolsInitialisationErrors.NoPools);
                                }
                            }
                        })
                        .catch((err) => {
                            console.error('Failed to initialise pools', err);
                            if (mounted) {
                                setPoolsInitialized(false);
                                setPoolsInitializationError(err);
                            }
                        })
                        .finally(() => {
                            setIsFetchingPools(false);
                        });
                };
                fetchAndSetPools();
            } else {
                console.error('Skipped pools initialisation, network not supported');
                setPoolsInitializationError(KnownPoolsInitialisationErrors.NetworkNotSupported);
            }
        } else {
            console.error('Skipped pools initialisation, provider not ready');
            resetPools();
            setPoolsInitializationError(KnownPoolsInitialisationErrors.ProviderNotReady);
        }
        return () => {
            mounted = false;
        };
    }, [poolLists, provider]);

    // fetch all pending commits
    useEffect(() => {
        let mounted = true;
        if (provider && poolsInitialized) {
            Object.values(pools).map((pool) => {
                const decimals = pool.poolInstance.settlementToken.decimals;
                const network = provider.network.chainId;
                if (isSupportedNetwork(network)) {
                    // fetch commits
                    fetchPendingCommits(network.toString() as V2_SUPPORTED_NETWORKS, {
                        pool: pool.poolInstance.address,
                    })
                        .then((pendingCommits) => {
                            if (mounted) {
                                addMutlipleCommits(
                                    pendingCommits.map((commit) => ({
                                        pool: pool.poolInstance.address,
                                        id: commit.commitID,
                                        amount: new BigNumber(ethers.utils.formatUnits(commit.amount, decimals)),
                                        type: commit.commitType,
                                        from: commit.from,
                                        txnHash: commit.txnHash,
                                        created: commit.timestamp,
                                        appropriateIntervalId: commit.updateIntervalId,
                                    })),
                                );
                            }
                        })
                        .catch((err) => {
                            console.error('Failed to initialise committer', err);
                        });
                }
            });
        }
        return () => {
            mounted = false;
        };
    }, [provider, poolsInitialized]);

    // update token balances and approvals when address changes
    useEffect(() => {
        if (!!account && poolsInitialized) {
            const pools_ = Object.values(pools).map((pool) => pool.poolInstance.address);
            // get and set token balances and approvals for each pool
            updateSettlementTokenBalances(pools_, provider, account);
            updatePoolTokenBalances(pools_, provider, account);
            updateTradeStats(pools_, network, account);
            updateTokenApprovals(pools_, provider, account);
        } else if (!account && poolsInitialized) {
            // account disconnect
            Object.keys(pools).map((pool) => {
                setTokenBalances(pool, {
                    shortTokenBalance: new BigNumber(0),
                    longTokenBalance: new BigNumber(0),
                    settlementTokenBalance: new BigNumber(0),
                });
            });
        }
    }, [account, network, poolsInitialized]);

    // update poolStats when poolsInitialized changes
    useEffect(() => {
        if (poolsInitialized) {
            const pools_ = Object.values(pools).map((pool) => pool.poolInstance.address);
            updatePoolCommitStats(pools_, network);
            updateNextPoolStates(pools_, network);
            updatePoolBalancerPrices(pools_, network);
        }
    }, [network, poolsInitialized]);
};
