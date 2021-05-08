// tree.js: Binary Tree abstraction for M5
// requires list.js
// Author: Joel Lee
const list = require('./list.js');
// make_empty_binary_tree returns an empty list
function make_empty_binary_tree() {
    return null;
}
// checks if a given list is a valid binary tree, according to the abstraction
function is_binary_tree(t) {
    return (is_empty_binary_tree(t) ||
        (list.length(t) === 3 && is_binary_tree(left_subtree_of(t)) && is_binary_tree(right_subtree_of(t))));
}
// make_binary_tree_node returns a binary tree node composed of the
// three elements passed in
function make_binary_tree_node(left, value, right) {
    if (!is_binary_tree(left)) {
        throw new Error('Left subtree is not a valid binary tree');
    }
    else if (!is_binary_tree(right)) {
        throw new Error('Right subtree is not a valid binary tree');
    }
    return list.list(left, value, right);
}
// is_empty_binary_tree checks if given binary tree node is an empty list
function is_empty_binary_tree(t) {
    return list.is_null(t);
}
// left_subtree_of returns the left subtree of a given binary tree node
function left_subtree_of(t) {
    return list.list_ref(t, 0);
}
// value_of returns the value of a given binary tree node
function value_of(t) {
    return list.list_ref(t, 1);
}
// right_subtree_of returns the right subtree of a given binary tree node
function right_subtree_of(t) {
    return list.list_ref(t, 2);
}
exports.make_empty_binary_tree = make_empty_binary_tree;
exports.is_binary_tree = is_binary_tree;
exports.make_binary_tree_node = make_binary_tree_node;
exports.is_empty_binary_tree = is_empty_binary_tree;
exports.left_subtree_of = left_subtree_of;
exports.value_of = value_of;
exports.right_subtree_of = right_subtree_of;
