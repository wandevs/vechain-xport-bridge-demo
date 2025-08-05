// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWmbGateway {
    function estimateFee(uint256 targetChainId, uint256 gasLimit) external view returns (uint256 fee);
    function dispatchMessage(uint256 toChainId, address to, bytes calldata data) external payable returns (bytes32 messageId);
    function dispatchMessageV2(uint256 toChainId, address to, uint256 gasLimit, bytes calldata data) external returns (bytes32 messageId);
    function chainId() external view returns (uint256);
}