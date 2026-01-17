// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    event CountUpdated(uint256 newCount);

    function multicall(bytes[] calldata data) external returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            (bool success, bytes memory result) = address(this).delegatecall(data[i]);
            require(success, "Counter: multicall failed");
            results[i] = result;
        }
    }

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
