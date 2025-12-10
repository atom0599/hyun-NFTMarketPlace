'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  getListing,
  buyNFT,
  cancelListing,
  updateListing,
  approveToken,
  getTokenBalance,
  getTokenAllowance,
  getTokenDecimals,
  getTokenSymbol,
  formatTokenAmount,
  parseTokenAmount,
  ownerOf,
  getTokenURI,
} from '@/lib/contracts'
import { marketplaceContractAddress } from '@/lib/constants'
import { getIPFSGatewayUrl } from '@/lib/ipfs'

interface NFTListing {
  tokenId: bigint
  price: bigint
  seller: `0x${string}`
  isListed: boolean
  image?: string
  name?: string
}

export function Marketplace() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const [listings, setListings] = useState<NFTListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null)
  const [nftDetails, setNftDetails] = useState<{
    description?: string
    attributes?: any[]
    owner?: string
  } | null>(null)
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0))
  const [tokenDecimals, setTokenDecimals] = useState<number>(18)
  const [tokenSymbol, setTokenSymbol] = useState<string>('MTK')
  const [maxTokenId, setMaxTokenId] = useState(100)
  const [status, setStatus] = useState<string>('')
  const [balanceError, setBalanceError] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // ... (헬퍼 함수들은 그대로 유지) ...
  const processBatch = async <T, R>(items: T[], batchSize: number, processor: (item: T) => Promise<R | null>): Promise<R[]> => {
    const results: R[] = []
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(batch.map(processor))
      batchResults.forEach((result) => { if (result.status === 'fulfilled' && result.value !== null) results.push(result.value) })
    }
    return results
  }
  const convertIPFSUrl = (url: string) => url.startsWith('ipfs://') ? getIPFSGatewayUrl(url.replace('ipfs://', '')) : url
  const fetchMetadata = async (tokenURI: string) => { try { let url = convertIPFSUrl(tokenURI); const res = await fetch(url); if (!res.ok) return null; const meta = await res.json(); if (meta.image) meta.image = convertIPFSUrl(meta.image); return meta; } catch { return null; } }

  const fetchListings = async () => {
    setIsLoading(true); try {
      const tokenIds = Array.from({ length: maxTokenId + 1 }, (_, i) => BigInt(i))
      const listed: { tokenId: bigint; listing: { price: bigint; seller: `0x${string}`; isListed: boolean } }[] = []
      await processBatch(tokenIds, 20, async (id) => { try { const l = await getListing(id); return l.isListed ? { tokenId: id, listing: l } : null } catch { return null } }).then(r => listed.push(...r))
      if (listed.length === 0) { setListings([]); setIsLoading(false); return }
      const res = await Promise.all(listed.map(async ({ tokenId, listing }) => {
        let img, name; try { const uri = await getTokenURI(tokenId); const meta = await fetchMetadata(uri); img = meta?.image; name = meta?.name } catch { }
        return { tokenId, price: listing.price, seller: listing.seller, isListed: true, image: img, name }
      }))
      setListings(res)
    } catch { setListings([]) } setIsLoading(false)
  }

  const fetchNFTDetails = async (listing: NFTListing) => {
    try { const uri = await getTokenURI(listing.tokenId); const meta = await fetchMetadata(uri); const owner = await ownerOf(listing.tokenId); setNftDetails({ description: meta?.description, attributes: meta?.attributes, owner }) } catch { setNftDetails(null) }
  }
  const handleNFTClick = async (listing: NFTListing) => { setSelectedNFT(listing); await fetchNFTDetails(listing) }
  const fetchTokenInfo = async () => { if (!isConnected || !address) return; try { const [d, s, b] = await Promise.all([getTokenDecimals(), getTokenSymbol(), getTokenBalance(address).catch(() => BigInt(0))]); setTokenDecimals(d); setTokenSymbol(s); setTokenBalance(b); setBalanceError('') } catch (e: any) { setBalanceError(e.message) } }
  useEffect(() => { if (isConnected) { fetchListings(); fetchTokenInfo() } }, [isConnected, address])
  const handleBuy = async (tokenId: bigint, price: bigint) => { if (!isConnected) return alert('지갑 연결 필요'); try { const allow = await getTokenAllowance(address!, marketplaceContractAddress as `0x${string}`); if (allow < price) { setStatus('승인 중...'); await approveToken(marketplaceContractAddress as `0x${string}`, price * BigInt(100)); setStatus('승인 완료') } setStatus('구매 중...'); await buyNFT(tokenId); setStatus('구매 완료'); await fetchListings(); await fetchTokenInfo(); setTimeout(() => setStatus(''), 5000) } catch (e: any) { setStatus(`실패: ${e.message}`); setTimeout(() => setStatus(''), 5000) } }
  const handleCancel = async (tokenId: bigint) => { if (!isConnected) return alert('지갑 연결 필요'); try { setStatus('취소 중...'); await cancelListing(tokenId); setStatus('취소 완료'); await fetchListings(); setTimeout(() => setStatus(''), 5000) } catch (e: any) { setStatus(`실패: ${e.message}`); setTimeout(() => setStatus(''), 5000) } }
  const handleUpdatePrice = async (tokenId: bigint, newPrice: string) => { if (!isConnected) return alert('지갑 연결 필요'); try { const decimals = await getTokenDecimals(); const wei = parseTokenAmount(newPrice, decimals); setStatus('수정 중...'); await updateListing(tokenId, wei); setStatus('수정 완료'); await fetchListings(); setTimeout(() => setStatus(''), 5000) } catch (e: any) { setStatus(`실패: ${e.message}`); setTimeout(() => setStatus(''), 5000) } }

  if (!mounted) return <div className="p-4 text-black dark:text-white"><p>로딩 중...</p></div>
  if (!isConnected) return <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><p className="text-yellow-800 dark:text-yellow-200">마켓플레이스를 사용하려면 먼저 지갑을 연결해주세요.</p></div>

  return (
    // [중요] 최상위 div에 text-black dark:text-white 강제 적용
    <div className="space-y-6 text-black dark:text-white">
      <div className="space-y-2">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-semibold">
                내 토큰 잔액: {formatTokenAmount(tokenBalance, tokenDecimals)} {tokenSymbol}
              </p>
              {tokenBalance === BigInt(0) && (
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  토큰이 없습니다. 프로필 탭에서 무료 토큰을 받아보세요.
                </p>
              )}
            </div>
            <button onClick={fetchTokenInfo} className="text-xs px-3 py-1 bg-blue-200 dark:bg-blue-800 text-black dark:text-white rounded hover:bg-blue-300 dark:hover:bg-blue-700">새로고침</button>
          </div>
        </div>
        {status && <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"><p className="text-sm text-black dark:text-white">{status}</p></div>}
      </div>

      <div className="flex justify-between items-center">
        {/* [확인] 여기 클래스가 적용됨 */}
        <h2 className="text-2xl font-bold text-black dark:text-white">마켓플레이스</h2>
        <button onClick={() => { fetchListings(); fetchTokenInfo() }} disabled={isLoading} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50">{isLoading ? '로딩 중...' : '새로고침'}</button>
      </div>

      <div>
        {/* [확인] 여기도 적용됨 */}
        <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">판매 중인 NFT</h3>
        {listings.length === 0 ? (
          <p className="text-black dark:text-gray-400">판매 중인 NFT가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <NFTCard key={listing.tokenId.toString()} listing={listing} onBuy={handleBuy} isOwner={listing.seller.toLowerCase() === address?.toLowerCase()} onCancel={handleCancel} onUpdate={handleUpdatePrice} onClick={() => handleNFTClick(listing)} />
            ))}
          </div>
        )}
      </div>

      {selectedNFT && <NFTDetailModal listing={selectedNFT} details={nftDetails} onClose={() => { setSelectedNFT(null); setNftDetails(null) }} onBuy={handleBuy} isOwner={selectedNFT.seller.toLowerCase() === address?.toLowerCase()} onCancel={handleCancel} address={address} />}
    </div>
  )
}

function NFTCard({ listing, onBuy, isOwner, onCancel, onUpdate, onClick }: any) {
  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState<string>(`NFT #${listing.tokenId.toString()}`)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newPrice, setNewPrice] = useState('')

  useEffect(() => {
    const load = async () => { try { const { getTokenURI } = await import('@/lib/contracts'); const { getIPFSGatewayUrl } = await import('@/lib/ipfs'); const uri = await getTokenURI(listing.tokenId); let url = uri.startsWith('ipfs://') ? getIPFSGatewayUrl(uri.replace('ipfs://', '')) : uri; const res = await fetch(url); if (res.ok) { const meta = await res.json(); setImage(meta.image?.startsWith('ipfs://') ? getIPFSGatewayUrl(meta.image.replace('ipfs://', '')) : meta.image); setName(meta.name || `NFT #${listing.tokenId.toString()}`) } } catch { } }; load()
  }, [listing.tokenId])

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700" onClick={onClick}>
      {image && <img src={image} alt={name} className="w-full h-48 object-cover rounded-lg mb-4 bg-gray-100 dark:bg-gray-700" />}
      {/* 카드 내부 텍스트 색상 강제 지정 */}
      <h4 className="font-semibold mb-2 text-black dark:text-white">{name}</h4>
      <p className="text-sm text-black dark:text-gray-400 mb-2">Token ID: {listing.tokenId.toString()}</p>
      <p className="text-lg font-bold mb-4 text-black dark:text-white">가격: {formatTokenAmount(listing.price)} MTK</p>

      {isUpdating ? (
        <div className="mb-2" onClick={e => e.stopPropagation()}>
          <input type="number" placeholder="새 가격" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full border p-2 rounded mb-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white" />
          <div className="flex gap-2">
            <button onClick={() => { if (onUpdate && newPrice) { onUpdate(listing.tokenId, newPrice); setIsUpdating(false) } }} className="flex-1 bg-green-500 text-white text-xs py-2 rounded">확인</button>
            <button onClick={() => setIsUpdating(false)} className="flex-1 bg-gray-500 text-white text-xs py-2 rounded">취소</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {isOwner ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIsUpdating(true) }} className="flex-1 px-2 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs font-medium">가격수정</button>
              <button onClick={(e) => { e.stopPropagation(); onCancel(listing.tokenId) }} className="flex-1 px-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium">판매취소</button>
            </>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onBuy(listing.tokenId, listing.price) }} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium">구매하기</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onClick() }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">상세</button>
        </div>
      )}
    </div>
  )
}

function NFTDetailModal({ listing, details, onClose, onBuy, isOwner, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-black dark:text-white">{listing.name || `NFT #${listing.tokenId.toString()}`}</h2>
            <button onClick={onClose} className="text-black dark:text-gray-300 text-2xl">✕</button>
          </div>
          {listing.image && <div className="mb-6"><img src={listing.image} alt={listing.name} className="w-full h-96 object-contain rounded-lg bg-gray-100 dark:bg-gray-700" /></div>}
          <div className="space-y-4 mb-6">
            <div><h3 className="text-sm font-medium text-black dark:text-gray-400 mb-1">Token ID</h3><p className="text-lg font-mono text-black dark:text-white">{listing.tokenId.toString()}</p></div>
            <div><h3 className="text-sm font-medium text-black dark:text-gray-400 mb-1">가격</h3><p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatTokenAmount(listing.price, 18)} MTK</p></div>
            {details?.owner && <div><h3 className="text-sm font-medium text-black dark:text-gray-400 mb-1">소유자</h3><code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 text-black dark:text-gray-200 px-3 py-1 rounded">{details.owner}</code></div>}
          </div>
          {details?.description && <div className="mb-6"><h3 className="text-sm font-medium text-black dark:text-gray-400 mb-2">설명</h3><p className="text-black dark:text-gray-300 whitespace-pre-wrap">{details.description}</p></div>}
          {details?.attributes && <div className="mb-6"><h3 className="text-sm font-medium text-black dark:text-gray-400 mb-2">속성</h3><div className="grid grid-cols-2 gap-2">{details.attributes.map((attr: any, i: number) => <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-black dark:text-gray-400 mb-1">{attr.trait_type}</p><p className="text-sm font-semibold text-black dark:text-white">{attr.value}</p></div>)}</div></div>}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg">닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}