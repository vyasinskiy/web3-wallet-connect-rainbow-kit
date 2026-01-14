// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    event CountUpdated(uint256 newCount);

    function increment() external {
        count += 1;
        emit CountUpdated(count);
    }

    function decrement() external {
        require(count > 0, "Counter: below zero");
        count -= 1;
        emit CountUpdated(count);
    }

    function setCount(uint256 newCount) external {
        count = newCount;
        emit CountUpdated(count);
    }
}
