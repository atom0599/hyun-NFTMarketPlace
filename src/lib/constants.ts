// [업데이트됨] 요청하신 새 컨트랙트 주소 적용
export const tokenContractAddress = '0x881648aDB7EA76569Df0c384DE06f24404c26D79'
export const nftContractAddress = '0x123C05B49D0e7c3f76Ebd93B47155e6673523448'
export const marketplaceContractAddress = '0xF791ef7D1755a24275CFC4c3E9863d33CD1E22Ac'

export const SEPOLIA_CHAIN_ID = 11155111

// RPC 설정
const customRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL

export const SEPOLIA_RPC_URL = customRpcUrl || 'https://rpc.sepolia.org'

export const SEPOLIA_RPC_URLS = customRpcUrl
  ? [
      customRpcUrl,
      'https://rpc.sepolia.org',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc2.sepolia.org',
    ]
  : [
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc2.sepolia.org',
    ]

export const SEPOLIA_NETWORK = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
}