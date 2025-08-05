// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./WmbApp.sol";

contract Erc20TokenRemote is ERC20, WmbApp {
    event CrossTo(address indexed toUser, uint256 amount);
    event CrossBack(address indexed toUser, uint256 amount);

    constructor(address _wmbGateway, address _remoteSC, uint256 _remoteChainId, string memory _name, string memory _symbol) WmbApp(_wmbGateway) ERC20(_name, _symbol) payable {
        remoteSC = _remoteSC;
        remoteChainId = _remoteChainId;
        isInited = true;

        uint256 fee = estimateFee(remoteChainId, 400000);
        require(msg.value >= fee, "message bridge fee not enough");
        if (msg.value > fee) {
            Address.sendValue(payable(msg.sender), msg.value - fee);
        }
        IWmbGateway(wmbGateway).dispatchMessage{value: fee}(remoteChainId, remoteSC, abi.encode(1));
    }

    function crossBack(address toUser, uint256 amount) external payable {
        uint256 fee = estimateFee(remoteChainId, 400000);
        require(msg.value >= fee, "message bridge fee not enough");
        _burn(msg.sender, amount);
        bytes memory data = abi.encode(toUser, amount);
        IWmbGateway(wmbGateway).dispatchMessage{value: fee}(remoteChainId, remoteSC, data);
        emit CrossBack(toUser, amount);
    }

    function _wmbReceive(
        bytes calldata data,
        bytes32 /*messageId*/,
        uint256 /*fromChainId*/,
        address /*fromSC*/
    ) internal override {
        (address toUser, uint256 amount) = abi.decode(data, (address, uint256));
        _mint(toUser, amount);
        emit CrossTo(toUser, amount);
    }
}
