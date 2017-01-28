var Star = (function () {
    function Star(uni, d) {
        this.uni = uni;
        this.d = d;

        d.mega = true;
        d.realSize = d.size;
        d.size = this.uni.opts.starRadius;

        this.node = d3.select('#tag-' + d.id);
        this.uniNode = this.uni.layout.uni;

        this.planets = new Planets(this);
        this.exploded = false;
        this.collapsed = false;

        this.uni.tagNodeSizeUpdated(this.node);
    }

    Star.prototype.explode = function () {
        if (this.collapsed) {
            return;
        }

        this.exploded = true;
        this.d.fixed = true;
        this.x = this.d.x;
        this.y = this.d.y;

        if (!this.planets.isEmpty()) {
            this.node.classed('mega', true);
            this.uniNode.classed('uni-mega', true);
            this.planets.show();
        }
    };

    Star.prototype.collapse = function () {
        this.collapsed = true;
        this.d.fixed = false;
        this.d.mega = false;
        this.d.size = this.d.realSize;

        this.node.classed('mega', false);
        this.uniNode.classed('uni-mega', false);

        this.planets.destroy();
        delete this.planets;

        this.uni.tagNodeSizeUpdated(this.node);
    };

    Star.prototype.fixPosition = function () {
        if (typeof this.x !== 'undefined') {
            this.d.x = this.x;
        }

        if (typeof this.y !== 'undefined') {
            this.d.y = this.y;
        }
    };

    return Star;
})();
