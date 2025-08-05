// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./WmbApp.sol";

contract Erc20TokenHome is WmbApp {
    using SafeERC20 for IERC20;
    address public token;

    event CrossTo(address indexed toUser, uint256 amount);
    event CrossBack(address indexed toUser, uint256 amount);

    constructor(address _wmbGateway, address _token) WmbApp(_wmbGateway) {
        token = _token;
    }

    function crossTo(address toUser, uint256 amount) external payable {
        uint256 fee = estimateFee(remoteChainId, 400000);
        require(msg.value >= fee, "message bridge fee not enough");
        if (msg.value > fee) {
            Address.sendValue(payable(msg.sender), msg.value - fee);
        }
        uint256 beforeBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBalance = IERC20(token).balanceOf(address(this));
        uint256 _amount = afterBalance - beforeBalance;
        bytes memory data = abi.encode(toUser, _amount);
        IWmbGateway(wmbGateway).dispatchMessage{value: fee}(remoteChainId, remoteSC, data);
        emit CrossTo(toUser, _amount);
    }

    function _wmbReceive(
        bytes calldata data,
        bytes32 /*messageId*/,
        uint256 /*fromChainId*/,
        address /*fromSC*/
    ) internal override {
        (address toUser, uint256 amount) = abi.decode(data, (address, uint256));
        IERC20(token).safeTransfer(toUser, amount);
        emit CrossBack(toUser, amount);
    }
}