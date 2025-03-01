
export const knownPatterns = {
    rust: [
        {
            name: "Reentrancy",
            description: "Occurs when a contract makes an external call to another untrusted contract before it resolves its own state.",
            example: `
            fn withdraw(&mut self, amount: u64) {
                let balance = self.balances.get(&env::signer_account_id()).unwrap();
                assert!(balance >= amount, "Insufficient balance");
                Promise::new(env::signer_account_id()).transfer(amount);
                self.balances.insert(&env::signer_account_id(), &(balance - amount));
            }
            `
        },
        {
            name: "Integer Overflow and Underflow",
            description: "Occurs when an arithmetic operation exceeds the maximum or minimum size of the integer type.",
            example: `
            fn add(a: u32, b: u32) -> u32 {
                a + b // Potential overflow if a + b > u32::MAX
            }
            `
        },
        {
            name: "Unchecked External Calls",
            description: "Occurs when a contract makes an external call without checking for success.",
            example: `
            fn call_external_contract(&self, contract_id: AccountId, amount: u128) {
                Promise::new(contract_id).transfer(amount);
                // No check if the transfer was successful
            }
            `
        },
        {
            name: "Denial of Service",
            description: "Occurs when a contract can be forced into a state where it cannot function properly.",
            example: `
            fn process_large_array(&self, data: Vec<u64>) {
                for item in data {
                    // Processing each item could be expensive
                }
            }
            `
        }
    ]
};
