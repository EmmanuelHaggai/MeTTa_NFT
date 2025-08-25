// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MeTTaPaymentSplitter is PaymentSplitter, Ownable {
    event PaymentReceived(address indexed from, uint256 amount);
    event PaymentReleased(address indexed to, uint256 amount);
    event PayeesUpdated(address[] payees, uint256[] shares);
    
    constructor(address[] memory _payees, uint256[] memory _shares) 
        PaymentSplitter(_payees, _shares) 
    {
        // Constructor automatically calls PaymentSplitter constructor
    }
    
    function deposit() external payable {
        require(msg.value > 0, "No payment sent");
        emit PaymentReceived(msg.sender, msg.value);
    }
    
    function releaseAll() external {
        uint256 count = payeeCount;
        for (uint256 i = 0; i < count; i++) {
            address payeeAddr = payee(i);
            if (releasable(payeeAddr) > 0) {
                release(payable(payeeAddr));
                emit PaymentReleased(payeeAddr, releasable(payeeAddr));
            }
        }
    }
    
    function releaseToPayee(address payable account) external {
        require(shares(account) > 0, "Account has no shares");
        uint256 amount = releasable(account);
        require(amount > 0, "Account is not due payment");
        
        release(account);
        emit PaymentReleased(account, amount);
    }
    
    function getPayeeInfo() external view returns (address[] memory payees, uint256[] memory payeeShares) {
        uint256 count = payeeCount;
        payees = new address[](count);
        payeeShares = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address currentPayee = payee(i);
            payees[i] = currentPayee;
            payeeShares[i] = shares(currentPayee);
        }
    }
    
    function getTotalReleased() external view returns (uint256) {
        return totalReleased();
    }
    
    function getTotalReceived() external view returns (uint256) {
        return address(this).balance + totalReleased();
    }
    
    receive() external payable override {
        emit PaymentReceived(msg.sender, msg.value);
    }
}