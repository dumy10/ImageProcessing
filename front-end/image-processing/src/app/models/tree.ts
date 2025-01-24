/**
 * Generic Tree class representing a tree data structure.
 * @template T - The type of the value stored in the tree nodes.
 */
export class Tree<T> {
  /**
   * The root node of the tree.
   * @type {TreeNode<T> | null}
   */
  root: TreeNode<T> | null;

  /**
   * Constructor for the Tree class.
   * Initializes the root to null.
   */
  constructor() {
    this.root = null;
  }

  /**
   * Sets the root node of the tree.
   * @param {TreeNode<T>} node - The node to set as the root.
   */
  setRoot(node: TreeNode<T>): void {
    this.root = node;
  }
}

/**
 * Generic TreeNode class representing a node in a tree data structure.
 * @template T - The type of the value stored in the tree node.
 */
export class TreeNode<T> {
  /**
   * The value stored in the node.
   * @type {T}
   */
  value: T;

  /**
   * The children of the node.
   * @type {TreeNode<T>[]}
   */
  children: TreeNode<T>[];

  /**
   * Constructor for the TreeNode class.
   * @param {T} value - The value to store in the node.
   */
  constructor(value: T) {
    this.value = value;
    this.children = [];
  }

  /**
   * Adds a child node to the current node.
   * @param {TreeNode<T>} node - The node to add as a child.
   */
  addChild(node: TreeNode<T>): void {
    this.children.push(node);
  }
}
