var SpecialNode = (function () {
    function SpecialNode(opts) {
        this.opts = $.extend({
            x: 0,
            y: 0,
            size: 0
        }, opts || {});

        this.x = this.opts.x;
        this.y = this.opts.y;
        this.size = this.opts.size;
        this.special = true;

        delete this.opts.x;
        delete this.opts.y;
        delete this.opts.size;
    }

    SpecialNode.prototype.setUni = function (uni) {
        this.uni = uni;

        if (!this.size) {
            this.size = this.uni.opts.minRadius;
        }

        return this;
    };

    SpecialNode.prototype.init = function (n) {};
    SpecialNode.prototype.tick = function (e, n) {};

    SpecialNode.prototype.click = function () {
        var self = this;

        this.uni.layout.moveToClick();

        if (!this.realSize) {
            this.realSize = this.size;
            this.size *= this.uni.opts.specialClickSizeMultiplier;
            this.uni.force.start();

            setTimeout(function () {
                self.size = self.realSize;
                delete self.realSize;
            }, this.uni.opts.specialClickSizeTimeout);
        }
    };

    return SpecialNode;
})();

var SpriteSpecialNode = (function (_parent) {
    SpriteSpecialNode.prototype = Object.create(_parent.prototype);
    SpriteSpecialNode.prototype.constructor = SpriteSpecialNode;
    function SpriteSpecialNode(opts) {
        _parent.call(this, $.extend({
            'imgUrl': null,
            'imgSize': 100,
            'moveTo': null,
            'moveRotate': true,
            'moveRotateDiff': -90,
            'moveForce': 30,
            'moveError': 150,
            'moveRotateError': 25,
            'moveRotateMax': 0,
            'moveHoldTicks': 5
        }, opts || {}));
    }

    SpriteSpecialNode.prototype.init = function (n) {
        this.moveTicks = 0;
        if (this.opts.imgUrl) {
            this.img = d3.select(n).append("image")
                .attr("xlink:href", this.opts.imgUrl)
                .attr("width", this.opts.imgSize)
                .attr("height", this.opts.imgSize)
                .attr("x", - this.opts.imgSize / 2)
                .attr("y", - this.opts.imgSize / 2)
            ;
        }
    };

    SpriteSpecialNode.prototype.tick = function (e, n) {
        if (this.img && this.opts.moveTo) {
            var move = this.opts.moveForce * e.alpha;
            var target = this.opts.moveTo;

            if (this.moveTicks < this.opts.moveHoldTicks) {
                this.x = target.x;
                this.y = target.y;
                this.moveTicks++;
            }

            Layout.move(move, this, target, this.opts.moveError);

            if (this.opts.moveRotate) {
                var oldAngle = this.imgAngle || 0;
                var newAngle = Math.floor(Layout.angle(this, target)) + this.opts.moveRotateDiff;

                if ((Math.abs(oldAngle - newAngle) % 360) > this.opts.moveRotateError) {
                    this.rotate(newAngle);
                }
            }
        }
    };

    SpriteSpecialNode.prototype.rotate = function (newAngle) {
        var maxRotate = this.opts.moveRotateMax;
        if (maxRotate > 0) {
            newAngle = Math.abs(newAngle) % 360;

            if (newAngle > maxRotate && newAngle < 180) {
                newAngle = maxRotate;
            }

            if (newAngle < (360 - maxRotate) && newAngle > 180) {
                newAngle = 360 - maxRotate;
            }
        }

        this.angle = newAngle;
        this.img.attr('transform', 'rotate(' + newAngle + ')');
    };

    return SpriteSpecialNode;
})(SpecialNode);

var TagMoveSpriteSpecialNode = (function (_parent) {
    TagMoveSpriteSpecialNode.prototype = Object.create(_parent.prototype);
    TagMoveSpriteSpecialNode.prototype.constructor = TagMoveSpriteSpecialNode;
    function TagMoveSpriteSpecialNode(opts) {
        _parent.call(this, $.extend({
            'moveToTag': null
        }, opts || {}));
    }

    TagMoveSpriteSpecialNode.prototype.init = function (n) {
        if (this.opts.moveToTag && !this.opts.moveTo) {
            this.opts.moveTo = this.uni.getTagNode(this.opts.moveToTag);
        }

        _parent.prototype.init.call(this, n);
    };

    return TagMoveSpriteSpecialNode;
})(SpriteSpecialNode);

var AstroCatSpecialNode = (function (_parent) {
    AstroCatSpecialNode.prototype = Object.create(_parent.prototype);
    AstroCatSpecialNode.prototype.constructor = AstroCatSpecialNode;
    function AstroCatSpecialNode(opts) {
        _parent.call(this, $.extend({
            'imgUrl': 'img/nodes/cat.png',
            'moveRotateMax' : 80,
            'moveToTag': 38 // Будущему космонавту
        }, opts || {}));
    }

    return AstroCatSpecialNode;
})(TagMoveSpriteSpecialNode);

var TardisSpecialNode = (function (_parent) {
    TardisSpecialNode.prototype = Object.create(_parent.prototype);
    TardisSpecialNode.prototype.constructor = TardisSpecialNode;
    function TardisSpecialNode(opts) {
        _parent.call(this, $.extend({
            'imgUrl': 'img/nodes/tardis.png',
            'moveRotateMax' : 30,
            'imgSize' : 80,
            'moveToTag': 233 // Гикам
        }, opts || {}));
    }

    return TardisSpecialNode;
})(TagMoveSpriteSpecialNode);

var DeathStarSpecialNode = (function (_parent) {
    DeathStarSpecialNode.prototype = Object.create(_parent.prototype);
    DeathStarSpecialNode.prototype.constructor = DeathStarSpecialNode;
    function DeathStarSpecialNode(opts) {
        _parent.call(this, $.extend({
            'imgUrl': 'img/nodes/death_star.png',
            'moveRotateMax' : 0,
            'imgSize': 120,
            'moveToTag': 137 // Корпоративная культура
        }, opts || {}));
    }

    return DeathStarSpecialNode;
})(TagMoveSpriteSpecialNode);

var FuturamaSpecialNode = (function (_parent) {
    FuturamaSpecialNode.prototype = Object.create(_parent.prototype);
    FuturamaSpecialNode.prototype.constructor = FuturamaSpecialNode;
    function FuturamaSpecialNode(opts) {
        _parent.call(this, $.extend({
            'imgUrl': 'img/nodes/futurama.png',
            'moveRotateMax' : 30,
            'moveRotateDiff': 180,
            'moveToTag': 95 // Развитие воображения
        }, opts || {}));
    }

    return FuturamaSpecialNode;
})(TagMoveSpriteSpecialNode);

var PonySpecialNode = (function (_parent) {
    PonySpecialNode.prototype = Object.create(_parent.prototype);
    PonySpecialNode.prototype.constructor = PonySpecialNode;
    function PonySpecialNode(opts) {
        _parent.call(this, $.extend({
            'imgUrl': 'img/nodes/pony.png',
            'moveRotateMax' : 60,
            'moveToTag': 40 // Будущему зоологу
        }, opts || {}));
    }

    return PonySpecialNode;
})(TagMoveSpriteSpecialNode);
