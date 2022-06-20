import { StaticPoolInfo } from '@tracer-protocol/pools-js';

/*
 * PoolList interface. Every poolsList must conform to this
 *  structure
 */
export interface PoolList {
    name: string;
    timestamp?: string;
    // readonly version: Version;
    pools: StaticPoolInfo[];
    keywords?: string[];
    logoURI?: string;
}

export interface PoolLists {
    All: StaticPoolInfo[];
}

export interface PoolListUris {
    All: string[];
    External: string[];
    Tracer: string;
}
