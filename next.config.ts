import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 서버 컴포넌트에서 외부 패키지로 처리 (테스트 파일 제외)
  serverExternalPackages: ['thread-stream', 'pino', '@metamask/sdk'],
  
  // Turbopack 설정 (빈 설정으로 webpack 대신 사용)
  turbopack: {},
  
  // Webpack 설정
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 서버 사이드에서 MetaMask SDK를 외부 패키지로 처리
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@metamask/sdk');
      } else if (typeof config.externals === 'object') {
        config.externals['@metamask/sdk'] = 'commonjs @metamask/sdk';
      }
    }
    return config;
  },
};

export default nextConfig;
